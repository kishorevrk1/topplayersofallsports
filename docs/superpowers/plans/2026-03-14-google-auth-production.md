# Google-Only Auth — Production-Ready Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Google-only authentication system so it is production-ready on both the Spring Boot backend (player-service) and the React frontend — with proper error codes, refresh token rotation, protected routes, auto-refresh, and all dead email/password code removed.

**Architecture:** Stateless JWT access tokens (15 min TTL) backed by DB-stored refresh tokens (7-day TTL, rotated on every use). Google OAuth 2.0 Authorization Code flow handled server-side — the frontend redirects the user to Google, receives the `code` on `/oauth/callback`, exchanges it with the backend via `POST /api/auth/google`, and stores the returned tokens in `localStorage`.

**Tech Stack:** Java 17, Spring Boot 3.2, Spring Security (stateless), JJWT 0.12.5, Flyway, PostgreSQL, React 18, Vite, TailwindCSS.

---

## File Map

### Backend — files touched

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `src/main/resources/db/migration/V6__create_auth_tables.sql` | DDL for `users` + `refresh_tokens` (Flyway-managed) |
| CREATE | `src/main/java/.../exception/AuthException.java` | Typed 401 exception |
| MODIFY | `src/main/java/.../exception/GlobalExceptionHandler.java` | Map `AuthException` → 401 |
| MODIFY | `src/main/java/.../service/AuthService.java` | Throw `AuthException`; rotate refresh token |
| MODIFY | `src/main/java/.../dto/GoogleCallbackRequest.java` | Add `@NotBlank` validation |
| MODIFY | `src/main/java/.../controller/AuthController.java` | Add `@Valid`; refactor `/me` to use `SecurityContextHolder` instead of manual JWT parsing |
| MODIFY | `src/main/java/.../config/SecurityConfig.java` | CORS from env var `ALLOWED_ORIGINS` |
| MODIFY | `src/main/resources/application.yml` | Add `cors.allowed-origins` + remove hardcoded Google secret default |
| CREATE | `src/main/java/.../scheduler/RefreshTokenCleanupTask.java` | Nightly purge of expired refresh tokens |
| MODIFY | `src/main/java/.../PlayerServiceApplication.java` | Add `@EnableScheduling` |
| CREATE | `src/test/java/.../controller/AuthControllerTest.java` | 9 controller tests |

### Frontend — files touched

| Action | Path | Purpose |
|--------|------|---------|
| DELETE | `src/pages/user-authentication/components/LoginForm.jsx` | Dead — email/password |
| DELETE | `src/pages/user-authentication/components/LoginPage.jsx` | Dead — email/password |
| DELETE | `src/pages/user-authentication/components/RegisterForm.jsx` | Dead — email/password |
| DELETE | `src/pages/user-authentication/components/ForgotPasswordForm.jsx` | Dead — email/password |
| DELETE | `src/pages/user-authentication/components/AuthTabs.jsx` | Dead — tab switcher |
| DELETE | `src/components/auth/OAuth2RedirectHandler.jsx` | Dead — old handler |
| DELETE | `src/components/auth/OAuth2CallbackHandler.jsx` | Dead — old handler |
| MODIFY | `src/pages/settings/index.jsx` | Replace password-change form in Security tab with "Connected via Google" info section |
| MODIFY | `src/pages/user-authentication/index.jsx` | Remove `<Outlet>`, render Google sign-in directly, show `?error=` messages |
| REWRITE | `src/components/auth/ProtectedRoute.jsx` | Spinner during load; redirect to `/user-authentication?from=<path>` when unauthed |
| MODIFY | `src/Routes.jsx` | Wrap `/profile`, `/profile/edit`, `/settings` with `<ProtectedRoute>`; remove dead auth sub-routes |
| MODIFY | `src/services/authService.js` | Add `fetchWithAuth()` helper with 401 auto-refresh + retry |
| MODIFY | `src/contexts/AuthContext.jsx` | On mount, verify token via `/me`; on 401, try refresh; on failure, clear session |

---

## Chunk 1: Backend

### Task 1: Flyway migration — create auth tables

**Files:**
- Create: `services/player-service/src/main/resources/db/migration/V6__create_auth_tables.sql`

Background: `users` and `refresh_tokens` are currently created by Hibernate `ddl-auto: update`. Flyway manages the rest of the schema. V6 brings these two tables under Flyway control so they can be safely migrated in production.

- [ ] **Step 1: Write the migration**

Create `V6__create_auth_tables.sql`:

```sql
-- V6: Bring auth tables under Flyway schema management.
-- Hibernate ddl-auto still runs AFTER Flyway so this uses CREATE TABLE IF NOT EXISTS.
-- In production, set ddl-auto to validate once this is stable.

CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(36)  PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    google_id   VARCHAR(255) UNIQUE,
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          VARCHAR(36)  PRIMARY KEY,
    token       VARCHAR(255) NOT NULL UNIQUE,
    user_id     VARCHAR(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

- [ ] **Step 2: Start the service and confirm Flyway applies V6 without error**

```bash
cd services/player-service
mvn spring-boot:run -Dspring-boot.run.profiles=dev 2>&1 | grep -E "V6|Flyway|ERROR"
```

Expected: `Successfully applied 1 migration to schema "public" (V6__create_auth_tables)` and no `ERROR`.

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/main/resources/db/migration/V6__create_auth_tables.sql
git commit -m "feat(auth): add Flyway V6 migration for users and refresh_tokens tables"
```

---

### Task 2: Typed AuthException — fix 500 error bug

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/exception/AuthException.java`
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/exception/GlobalExceptionHandler.java`
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/AuthService.java`

Background: `AuthService` throws `RuntimeException`, which `GlobalExceptionHandler.handleAllExceptions` catches and returns HTTP 500. Auth failures must return 401.

- [ ] **Step 1: Write the failing test (verify current wrong behaviour)**

In `src/test/java/.../controller/AuthControllerTest.java` (create the file for the first time here):

```java
package com.topplayersofallsports.playerservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.exception.AuthException;
import com.topplayersofallsports.playerservice.service.AuthService;
import com.topplayersofallsports.playerservice.service.JwtService;
import com.topplayersofallsports.playerservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean AuthService authService;
    @MockBean JwtService jwtService;
    @MockBean UserRepository userRepository;

    // --- Task 2 test: expired/invalid refresh token must return 401, not 500 ---
    @Test
    void refresh_withExpiredToken_returns401() throws Exception {
        when(authService.refreshAccessToken("expired-token"))
                .thenThrow(new AuthException("Refresh token expired"));

        mockMvc.perform(post("/api/auth/refresh")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("refreshToken", "expired-token"))))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: Run test — expect FAIL (returns 500 currently)**

```bash
cd services/player-service
mvn test -Dtest=AuthControllerTest#refresh_withExpiredToken_returns401 -pl . 2>&1 | tail -20
```

Expected: `FAILED` — 500 received instead of 401.

- [ ] **Step 3: Create `AuthException`**

Note: do NOT add `@ResponseStatus` — it conflicts with `@ExceptionHandler` in `GlobalExceptionHandler` and would be silently ignored. Rely solely on the handler.

```java
package com.topplayersofallsports.playerservice.exception;

public class AuthException extends RuntimeException {
    public AuthException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Register handler in `GlobalExceptionHandler`**

Add this method BEFORE `handleAllExceptions` (order matters — specific before generic; Spring picks the most-specific `@ExceptionHandler` but placing it first is defensive):

```java
@ExceptionHandler(AuthException.class)
public ResponseEntity<Map<String, Object>> handleAuthException(
        AuthException ex, WebRequest request) {
    log.warn("Auth failure: {}", ex.getMessage());
    Map<String, Object> body = createErrorBody(
        HttpStatus.UNAUTHORIZED.value(),
        "Unauthorized",
        ex.getMessage(),
        request.getDescription(false)
    );
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
}
```

- [ ] **Step 5: Update `AuthService` — replace all `RuntimeException` with `AuthException`**

In `refreshAccessToken()`:
```java
// BEFORE:
.orElseThrow(() -> new RuntimeException("Invalid refresh token"));
// ...
throw new RuntimeException("Refresh token expired — please sign in again");
// ...
.orElseThrow(() -> new RuntimeException("User not found"));

// AFTER:
.orElseThrow(() -> new AuthException("Invalid refresh token"));
// ...
throw new AuthException("Refresh token expired — please sign in again");
// ...
.orElseThrow(() -> new AuthException("User not found"));
```

Also update `authenticateWithGoogle()` — wrap the Google OAuth call in a try/catch:
```java
try {
    Map<String, Object> googleUser = googleOAuthService.exchangeCodeForUserInfo(code, redirectUri);
    // ... rest of method unchanged
} catch (Exception e) {
    log.warn("Google OAuth failed: {}", e.getMessage());
    throw new AuthException("Google authentication failed");
}
```

- [ ] **Step 6: Run test — expect PASS**

```bash
mvn test -Dtest=AuthControllerTest#refresh_withExpiredToken_returns401 -pl . 2>&1 | tail -10
```

Expected: `Tests run: 1, Failures: 0, Errors: 0`.

- [ ] **Step 7: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/exception/AuthException.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/exception/GlobalExceptionHandler.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/AuthService.java \
        services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java
git commit -m "fix(auth): return 401 on auth failures instead of 500"
```

---

### Task 3: Input validation on GoogleCallbackRequest

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/GoogleCallbackRequest.java`
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AuthController.java`
- Modify: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java`

- [ ] **Step 1: Write the failing test**

Add to `AuthControllerTest`:

```java
@Test
void googleCallback_withMissingCode_returns400() throws Exception {
    mockMvc.perform(post("/api/auth/google")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("redirectUri", "http://localhost:5173/oauth/callback"))))
            .andExpect(status().isBadRequest());
}
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
mvn test -Dtest=AuthControllerTest#googleCallback_withMissingCode_returns400 -pl . 2>&1 | tail -10
```

- [ ] **Step 3: Add validation annotations to `GoogleCallbackRequest`**

```java
package com.topplayersofallsports.playerservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleCallbackRequest {

    @NotBlank(message = "Google auth code is required")
    private String code;

    @NotBlank(message = "Redirect URI is required")
    private String redirectUri;
}
```

- [ ] **Step 4: Add `@Valid` to the controller endpoint**

In `AuthController.googleLogin()`:
```java
// BEFORE:
public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleCallbackRequest request) {

// AFTER:
public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleCallbackRequest request) {
```

Add import: `import jakarta.validation.Valid;`

- [ ] **Step 5: Run test — expect PASS**

```bash
mvn test -Dtest=AuthControllerTest#googleCallback_withMissingCode_returns400 -pl . 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/GoogleCallbackRequest.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AuthController.java \
        services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java
git commit -m "feat(auth): add @Valid input validation on GoogleCallbackRequest"
```

---

### Task 4: Refresh token rotation (security fix)

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/AuthService.java`
- Modify: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java`

Background: The current `refreshAccessToken()` returns the **same** refresh token value. This means a stolen token can be reused indefinitely until it expires. Token rotation issues a new refresh token on every use and invalidates the old one.

- [ ] **Step 1: Write the failing test**

Add to `AuthControllerTest`. This requires a more complete mock setup — add this helper and test:

```java
import com.topplayersofallsports.playerservice.dto.AuthResponse;

@Test
void refresh_returnsNewRefreshToken() throws Exception {
    AuthResponse firstResponse = AuthResponse.builder()
            .accessToken("new-access-token")
            .refreshToken("NEW-refresh-token")   // different from request token
            .userId("user-1").email("a@b.com").name("Test").role("USER")
            .build();

    when(authService.refreshAccessToken("old-refresh-token")).thenReturn(firstResponse);

    String body = mockMvc.perform(post("/api/auth/refresh")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("refreshToken", "old-refresh-token"))))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

    // Verify the returned refreshToken differs from the one we sent
    var result = mapper.readValue(body, AuthResponse.class);
    assert !result.getRefreshToken().equals("old-refresh-token") : "Refresh token must be rotated";
}
```

- [ ] **Step 2: Run test — confirm it passes with mock (mock already returns different token)**

```bash
mvn test -Dtest=AuthControllerTest#refresh_returnsNewRefreshToken -pl . 2>&1 | tail -10
```

This test should already pass at the controller level since the mock returns a new token. The real fix is in `AuthService`.

- [ ] **Step 3: Update `AuthService.refreshAccessToken()` to rotate the token**

Replace the current `refreshAccessToken` method:

```java
@Transactional
public AuthResponse refreshAccessToken(String refreshTokenValue) {
    RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
            .orElseThrow(() -> new AuthException("Invalid refresh token"));

    if (refreshToken.isExpired()) {
        refreshTokenRepository.delete(refreshToken);
        throw new AuthException("Refresh token expired — please sign in again");
    }

    User user = userRepository.findById(refreshToken.getUserId())
            .orElseThrow(() -> new AuthException("User not found"));

    // Rotate: delete old, issue new
    refreshTokenRepository.delete(refreshToken);

    RefreshToken newRefreshToken = refreshTokenRepository.save(RefreshToken.builder()
            .token(UUID.randomUUID().toString())
            .userId(user.getId())
            .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
            .build());

    String newAccessToken = jwtService.generateAccessToken(
            user.getId(), user.getEmail(), user.getRole().name());

    return AuthResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken.getToken())
            .userId(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().name())
            .build();
}
```

- [ ] **Step 4: Run all auth tests**

```bash
mvn test -Dtest=AuthControllerTest -pl . 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/AuthService.java \
        services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java
git commit -m "fix(auth): rotate refresh token on every /refresh call (prevent token reuse)"
```

---

### Task 4b: Refactor `/me` to use SecurityContextHolder

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AuthController.java`
- Modify: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java`

Background: The current `/me` endpoint manually parses the `Authorization` header and calls `jwtService.isValid()` directly. This duplicates `JwtAuthFilter`'s job and returns raw `RuntimeException` (500) on user-not-found. The correct approach is to rely on Spring Security — `JwtAuthFilter` already sets `SecurityContextHolder` for valid tokens, and Spring Security will return 401 automatically for unauthenticated requests when the route requires auth.

- [ ] **Step 1: Move `/me` out of `permitAll` in SecurityConfig**

In `SecurityConfig.filterChain()`, change:

```java
// BEFORE: /me is implicitly covered by /api/auth/** permitAll
.requestMatchers("/api/auth/**").permitAll()

// AFTER: only public auth endpoints are open; /me requires a valid token
.requestMatchers("/api/auth/google", "/api/auth/refresh", "/api/auth/logout").permitAll()
```

- [ ] **Step 2: Rewrite the `/me` endpoint**

Replace the entire `me()` method in `AuthController`:

```java
@GetMapping("/me")
public ResponseEntity<Map<String, Object>> me(
        @AuthenticationPrincipal String userId) {

    if (userId == null) {
        return ResponseEntity.status(401).build();
    }

    User user = userRepository.findById(userId)
            .orElseThrow(() -> new AuthException("User not found"));

    return ResponseEntity.ok(Map.of(
            "id",    user.getId(),
            "email", user.getEmail(),
            "name",  user.getName(),
            "role",  user.getRole().name()
    ));
}
```

Add import: `import org.springframework.security.core.annotation.AuthenticationPrincipal;`

Note: `JwtAuthFilter` sets `principal = userId` (String) via `UsernamePasswordAuthenticationToken(userId, null, authorities)`, so `@AuthenticationPrincipal` resolves to the userId string directly.

- [ ] **Step 3: Remove now-unused injections from AuthController**

`JwtService` and `UserRepository` are still needed (`jwtService` is no longer needed for `/me` but `userRepository` still is). Remove `jwtService` from the constructor if it's no longer used anywhere in the controller. Check usages — if no other method uses it, remove the `@Autowired`/constructor field and the import.

- [ ] **Step 4: Update the `/me` tests**

Update the two `/me` tests in `AuthControllerTest` — they no longer need to mock `jwtService.isValid()`:

```java
@Test
@WithMockUser(username = "user-1")
void me_withValidToken_returnsUserInfo() throws Exception {
    User user = User.builder()
            .id("user-1").email("test@example.com").name("Test User")
            .role(User.Role.USER).build();

    when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

    mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.role").value("USER"));
}

@Test
void me_withNoAuth_returns401() throws Exception {
    mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());
}
```

- [ ] **Step 5: Run auth tests**

```bash
mvn test -Dtest=AuthControllerTest -pl . 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AuthController.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/SecurityConfig.java \
        services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java
git commit -m "refactor(auth): use SecurityContextHolder in /me endpoint; remove manual JWT parsing"
```

---

### Task 5: CORS — env-var driven allowed origins

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/SecurityConfig.java`
- Modify: `services/player-service/src/main/resources/application.yml`

- [ ] **Step 1: Add `cors.allowed-origins` to `application.yml`**

Add this block at the end of `application.yml`:

```yaml
# ── CORS ──────────────────────────────────────────────────
cors:
  # Comma-separated list. Override via CORS_ALLOWED_ORIGINS env var in production.
  allowed-origins: >
    ${CORS_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000}
```

Also remove the hardcoded Google client-secret default so production must supply it:

```yaml
# BEFORE:
google:
  oauth2:
    client-secret: ${GOOGLE_CLIENT_SECRET:topplayersofallsports}

# AFTER:
google:
  oauth2:
    client-secret: ${GOOGLE_CLIENT_SECRET}   # MUST be set in production — no default
```

- [ ] **Step 2: Update `SecurityConfig` to read the property**

Replace the `corsConfigurationSource()` bean:

```java
@Value("${cors.allowed-origins}")
private String allowedOriginsRaw;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();

    config.setAllowedOrigins(origins);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of(
        "Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"
    ));
    config.setAllowCredentials(true);
    config.setExposedHeaders(List.of("X-Total-Count", "X-Page-Number", "X-Page-Size"));
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

Add import: `import java.util.Arrays;`

Also add the `@Value` field and remove the old hardcoded list.

- [ ] **Step 3: Start service locally — confirm CORS still works**

```bash
cd services/player-service
mvn spring-boot:run 2>&1 | grep -E "CORS|ERROR|Started" | head -5
```

Expected: service starts without error.

- [ ] **Step 4: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/SecurityConfig.java \
        services/player-service/src/main/resources/application.yml
git commit -m "feat(auth): read CORS allowed-origins from env var; remove hardcoded Google secret default"
```

---

### Task 6: Scheduled expired refresh-token cleanup

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/scheduler/RefreshTokenCleanupTask.java`
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/PlayerServiceApplication.java`
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/RefreshTokenRepository.java`

- [ ] **Step 1: Add bulk-delete query to `RefreshTokenRepository`**

```java
import java.time.LocalDateTime;

@Modifying
@Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
void deleteAllExpired(@Param("now") LocalDateTime now);
```

Add imports: `import org.springframework.data.repository.query.Param;`

- [ ] **Step 2: Create `RefreshTokenCleanupTask`**

```java
package com.topplayersofallsports.playerservice.scheduler;

import com.topplayersofallsports.playerservice.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@Slf4j
@RequiredArgsConstructor
public class RefreshTokenCleanupTask {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Runs nightly at 03:00 AM to purge expired refresh tokens.
     * Keeps the refresh_tokens table lean in production.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        log.info("Starting nightly refresh-token cleanup");
        refreshTokenRepository.deleteAllExpired(LocalDateTime.now());
        log.info("Refresh-token cleanup complete");
    }
}
```

- [ ] **Step 3: Enable scheduling on the application class**

Open `PlayerServiceApplication.java` and add `@EnableScheduling`:

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PlayerServiceApplication { ... }
```

Note: `PlayerSyncScheduler` already uses `@Scheduled` so the app likely already has `@EnableScheduling`. Check first — do not add it twice.

- [ ] **Step 4: Confirm service starts**

```bash
mvn spring-boot:run 2>&1 | grep -E "cleanup|Scheduled|ERROR" | head -5
```

- [ ] **Step 5: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/scheduler/RefreshTokenCleanupTask.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/PlayerServiceApplication.java \
        services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/RefreshTokenRepository.java
git commit -m "feat(auth): scheduled nightly cleanup of expired refresh tokens"
```

---

### Task 7: Complete AuthControllerTest — all edge cases

**Files:**
- Modify: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java`

**IMPORTANT:** Do NOT put `@WithMockUser` at the class level — it will bypass security for ALL tests including `me_withNoAuth_returns401`, causing it to incorrectly return 200. Use `@WithMockUser` only on individual tests that need an authenticated user.

Add the remaining 6 tests to `AuthControllerTest`. The file already has 3 tests from Tasks 2–4.

- [ ] **Step 1: Add remaining tests**

```java
import com.topplayersofallsports.playerservice.entity.User;
import java.util.Optional;

// --- Happy path: Google callback ---
@Test
void googleCallback_happyPath_returns200WithTokens() throws Exception {
    AuthResponse response = AuthResponse.builder()
            .accessToken("access-token").refreshToken("refresh-token")
            .userId("user-1").email("test@example.com").name("Test User").role("USER")
            .build();
    when(authService.authenticateWithGoogle(any(), any())).thenReturn(response);

    mockMvc.perform(post("/api/auth/google")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(
                        Map.of("code", "google-auth-code",
                               "redirectUri", "http://localhost:5173/oauth/callback"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-token"))
            .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
            .andExpect(jsonPath("$.role").value("USER"));
}

// --- Google callback: Google rejects the code ---
@Test
void googleCallback_googleRejectsCode_returns401() throws Exception {
    when(authService.authenticateWithGoogle(any(), any()))
            .thenThrow(new AuthException("Google authentication failed"));

    mockMvc.perform(post("/api/auth/google")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(
                        Map.of("code", "bad-code",
                               "redirectUri", "http://localhost:5173/oauth/callback"))))
            .andExpect(status().isUnauthorized());
}

// --- Logout: always 204 ---
@Test
void logout_returns204() throws Exception {
    doNothing().when(authService).logout(any());

    mockMvc.perform(post("/api/auth/logout")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(Map.of("refreshToken", "some-token"))))
            .andExpect(status().isNoContent());
}

// --- /me: valid token ---
@Test
@WithMockUser
void me_withValidToken_returnsUserInfo() throws Exception {
    String token = "valid.jwt.token";
    User user = User.builder()
            .id("user-1").email("test@example.com").name("Test User")
            .role(User.Role.USER).build();

    when(jwtService.isValid(token)).thenReturn(true);
    when(jwtService.getUserId(token)).thenReturn("user-1");
    when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

    mockMvc.perform(get("/api/auth/me")
                    .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("test@example.com"))
            .andExpect(jsonPath("$.role").value("USER"));
}

// --- /me: invalid/expired token ---
@Test
void me_withInvalidToken_returns401() throws Exception {
    when(jwtService.isValid("bad-token")).thenReturn(false);

    mockMvc.perform(get("/api/auth/me")
                    .header("Authorization", "Bearer bad-token"))
            .andExpect(status().isUnauthorized());
}

// --- /me: missing Authorization header ---
@Test
void me_withMissingHeader_returns401() throws Exception {
    mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());
}
```

- [ ] **Step 2: Run all 9 tests**

```bash
mvn test -Dtest=AuthControllerTest -pl . 2>&1 | tail -20
```

Expected: `Tests run: 9, Failures: 0, Errors: 0`.

- [ ] **Step 3: Commit**

```bash
git add services/player-service/src/test/java/com/topplayersofallsports/playerservice/controller/AuthControllerTest.java
git commit -m "test(auth): add full AuthControllerTest covering all 9 edge cases"
```

---

### Task 8: Run full backend test suite

- [ ] **Step 1: Run all tests**

```bash
cd services/player-service
mvn test 2>&1 | tail -30
```

Expected: `BUILD SUCCESS` — zero failures.

- [ ] **Step 2: If `PlayerControllerTest` fails, fix any mock issues**

The existing `PlayerControllerTest` uses `@WithMockUser` — it should still pass. If it fails because `JwtAuthFilter` now requires `JwtService`, check that the filter's mock bean is present in that test.

---

## Chunk 2: Frontend

### Task 9: Delete dead auth components

**Files to delete:**
- `src/pages/user-authentication/components/LoginForm.jsx`
- `src/pages/user-authentication/components/LoginPage.jsx`
- `src/pages/user-authentication/components/RegisterForm.jsx`
- `src/pages/user-authentication/components/ForgotPasswordForm.jsx`
- `src/pages/user-authentication/components/AuthTabs.jsx`
- `src/components/auth/OAuth2RedirectHandler.jsx`
- `src/components/auth/OAuth2CallbackHandler.jsx`

- [ ] **Step 1: Delete the files**

```bash
cd E:/Startup_projects/topplayersofallsports
rm src/pages/user-authentication/components/LoginForm.jsx
rm src/pages/user-authentication/components/LoginPage.jsx
rm src/pages/user-authentication/components/RegisterForm.jsx
rm src/pages/user-authentication/components/ForgotPasswordForm.jsx
rm src/pages/user-authentication/components/AuthTabs.jsx
rm src/components/auth/OAuth2RedirectHandler.jsx
rm src/components/auth/OAuth2CallbackHandler.jsx
```

- [ ] **Step 2: Search for any remaining imports of deleted files**

```bash
grep -r "LoginForm\|LoginPage\|RegisterForm\|ForgotPasswordForm\|AuthTabs\|OAuth2RedirectHandler\|OAuth2CallbackHandler" src/ --include="*.jsx" --include="*.js"
```

Expected: no matches. If any found, remove those imports.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "chore(auth): remove dead email/password auth components"
```

---

### Task 10: Implement ProtectedRoute

**Files:**
- Rewrite: `src/components/auth/ProtectedRoute.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Wraps routes that require authentication.
 * - Shows a spinner while auth state is loading from localStorage / /me check.
 * - Redirects unauthenticated users to /user-authentication?from=<current-path>
 *   so they land back on the intended page after signing in.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/user-authentication?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
}
```

- [ ] **Step 2: Verify the file saves without lint errors**

```bash
npx eslint src/components/auth/ProtectedRoute.jsx --max-warnings 0
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/ProtectedRoute.jsx
git commit -m "feat(auth): implement ProtectedRoute with loading spinner and redirect-back"
```

---

### Task 11: Protect routes in Routes.jsx

**Files:**
- Modify: `src/Routes.jsx`

- [ ] **Step 1: Update `Routes.jsx`**

Import `ProtectedRoute` and wrap the three private routes. The full updated routes section:

```jsx
import ProtectedRoute from 'components/auth/ProtectedRoute';

// Replace the three private route definitions:

<Route
  path="/profile"
  element={<ProtectedRoute><Profile /></ProtectedRoute>}
/>
<Route
  path="/profile/edit"
  element={<ProtectedRoute><EditProfile /></ProtectedRoute>}
/>
<Route
  path="/settings"
  element={<ProtectedRoute><Settings /></ProtectedRoute>}
/>
```

Leave all other routes (home, players, search, etc.) public — they don't require auth.

- [ ] **Step 2: Verify no import errors**

```bash
npx eslint src/Routes.jsx --max-warnings 0
```

- [ ] **Step 3: Commit**

```bash
git add src/Routes.jsx
git commit -m "feat(auth): protect /profile, /profile/edit, /settings routes"
```

---

### Task 12: Clean up UserAuthentication page

**Files:**
- Modify: `src/pages/user-authentication/index.jsx`

The current page uses `<Outlet />` (expecting nested routes that don't exist). Replace with a self-contained Google sign-in page that also handles error query params.

- [ ] **Step 1: Rewrite `index.jsx`**

```jsx
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthHeader from './components/AuthHeader';
import AuthBackground from './components/AuthBackground';
import AuthErrorBoundary from '../../components/AuthErrorBoundary';
import SocialLogins from './components/SocialLogins';
import { useAuth } from '../../contexts/AuthContext';

const ERROR_MESSAGES = {
  no_code:     'Sign-in was cancelled. Please try again.',
  auth_failed: 'Sign-in failed. Please try again.',
};

const UserAuthentication = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorKey = searchParams.get('error');
  const from = searchParams.get('from') || '/';

  // Already authenticated — send them on their way
  React.useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  return (
    <AuthErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        <div className="lg:hidden">
          <AuthHeader showBackButton={false} />
        </div>

        <AuthBackground />

        <div className="flex-1 flex flex-col justify-center px-4 py-8 lg:px-12 lg:py-16">
          <div className="hidden lg:block mb-8">
            <AuthHeader showBackButton={false} />
          </div>

          <div className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Welcome to TopPlayers
            </h2>
            <p className="text-text-secondary mb-8">
              Sign in to track your favourite athletes and access personalised rankings.
            </p>

            {errorKey && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {ERROR_MESSAGES[errorKey] ?? 'Something went wrong. Please try again.'}
              </div>
            )}

            <SocialLogins />
          </div>

          <div className="mt-auto pt-8 text-center text-sm text-text-secondary">
            <p>&copy; {new Date().getFullYear()} TopPlayersofAllSports. All rights reserved.</p>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
};

export default UserAuthentication;
```

- [ ] **Step 2: Lint check**

```bash
npx eslint src/pages/user-authentication/index.jsx --max-warnings 0
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/user-authentication/index.jsx
git commit -m "feat(auth): replace Outlet-based auth page with self-contained Google sign-in"
```

---

### Task 13: fetchWithAuth — auto-refresh interceptor

**Files:**
- Modify: `src/services/authService.js`

This adds a `fetchWithAuth(url, options)` helper. When a protected API call returns 401, it automatically tries to refresh the access token once and retries. If the refresh also fails, it clears the session and reloads the page (forces re-login).

- [ ] **Step 1: Update `authService.js`**

```js
const PLAYER_API = import.meta.env.VITE_PLAYER_API_URL || 'http://localhost:8084';

// Internal flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshPromise = null;

const authService = {
  async loginWithGoogle(code, redirectUri) {
    const res = await fetch(`${PLAYER_API}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`Google authentication failed: ${err}`);
    }
    return res.json();
  },

  async refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${PLAYER_API}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Token refresh failed — please sign in again');
    const data = await res.json();

    // Store rotated tokens
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    const userInfo = { id: data.userId, email: data.email, name: data.name, role: data.role };
    localStorage.setItem('auth_user', JSON.stringify(userInfo));
    return data;
  },

  async logout(refreshToken) {
    const token = refreshToken ?? localStorage.getItem('refresh_token');
    await fetch(`${PLAYER_API}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    }).catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
  },

  async getMe() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No access token');
    const res = await fetch(`${PLAYER_API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  getAccessToken() {
    return localStorage.getItem('access_token');
  },

  /**
   * Drop-in replacement for fetch() on authenticated endpoints.
   * Automatically retries with a fresh access token on 401.
   * On second 401 (refresh also failed), clears session and redirects to sign-in.
   */
  async fetchWithAuth(url, options = {}) {
    const makeRequest = () => {
      const token = localStorage.getItem('access_token');
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    };

    let response = await makeRequest();

    if (response.status === 401) {
      // Deduplicate concurrent 401s — only one refresh in-flight at a time.
      // refreshPromise is reset to null in finally() so stale promises don't persist.
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = authService.refreshAccessToken()
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;            // wait for the shared in-flight refresh
        response = await makeRequest();  // retry once with new access token
      } catch {
        // Refresh failed — clear session and force re-login
        await authService.logout();
        window.location.href = '/user-authentication?error=auth_failed';
        throw new Error('Session expired — redirecting to sign-in');
      }
    }

    return response;
  },
};

export default authService;
```

- [ ] **Step 2: Lint check**

```bash
npx eslint src/services/authService.js --max-warnings 0
```

- [ ] **Step 3: Commit**

```bash
git add src/services/authService.js
git commit -m "feat(auth): add fetchWithAuth with auto-refresh on 401 and token rotation support"
```

---

### Task 14: AuthContext — server-side token validation on mount

**Files:**
- Modify: `src/contexts/AuthContext.jsx`

Currently the context only reads from localStorage. In production a token in localStorage could be from an old session that's been revoked server-side. On mount, verify the access token against `/me`; if it returns 401, try to refresh; if refresh fails, clear the session.

- [ ] **Step 1: Update `AuthContext.jsx`**

```jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((authResponse) => {
    localStorage.setItem('access_token',  authResponse.accessToken);
    localStorage.setItem('refresh_token', authResponse.refreshToken);
    const userInfo = {
      id:    authResponse.userId,
      email: authResponse.email,
      name:  authResponse.name,
      role:  authResponse.role,
    };
    localStorage.setItem('auth_user', JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // On mount: verify token is still valid server-side.
  // Falls back to refresh if access token is expired but refresh token is valid.
  // Uses isMounted flag to prevent state updates if the component unmounts or
  // login() fires concurrently (e.g., OAuthCallback runs before mount resolves).
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedUser  = localStorage.getItem('auth_user');
      const accessToken = localStorage.getItem('access_token');

      // Fast short-circuit: nothing in storage — skip all network calls
      if (!storedUser || !accessToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // Happy path: access token still valid server-side
        await authService.getMe();
        if (isMounted) setUser(JSON.parse(storedUser));
      } catch {
        // Access token invalid — try refresh (covers expiry case)
        try {
          const refreshed = await authService.refreshAccessToken();
          if (isMounted) setUser({
            id:    refreshed.userId,
            email: refreshed.email,
            name:  refreshed.name,
            role:  refreshed.role,
          });
        } catch {
          // Both access and refresh failed — clear stale session silently
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          if (isMounted) setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => { isMounted = false; };  // Cleanup: prevent setState after unmount or concurrent login
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
```

- [ ] **Step 2: Lint check**

```bash
npx eslint src/contexts/AuthContext.jsx --max-warnings 0
```

- [ ] **Step 3: Commit**

```bash
git add src/contexts/AuthContext.jsx
git commit -m "feat(auth): validate token server-side on mount; auto-refresh if expired"
```

---

### Task 16: Remove password-change form from Settings Security tab

**Files:**
- Modify: `src/pages/settings/index.jsx`

The Security tab currently shows a password-change form (`handlePasswordChange`) that calls `userProfileService.changePassword()`. There is no such backend endpoint and users sign in exclusively via Google — a password field makes no sense and will always fail silently.

- [ ] **Step 1: Remove passwordForm state, twoFactorEnabled state, handlePasswordChange, and the Security tab form**

Make these changes in `src/pages/settings/index.jsx`:

1. Remove the `passwordForm` state (lines 47–51)
2. Remove the `handlePasswordChange` function (lines 84–108)
3. Remove `twoFactorEnabled` from `accountSettings` initial state — it has no backend and is never set
4. Replace the entire Security tab content (`{activeTab === 'security' && ...}`) with:

```jsx
{activeTab === 'security' && (
  <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>

    {/* Sign-in method */}
    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
        <Icon name="Chrome" size={20} className="text-red-500" />
      </div>
      <div>
        <p className="font-medium text-gray-900">Connected via Google</p>
        <p className="text-sm text-gray-600 mt-1">
          Your account is secured by Google Sign-In. Manage your Google account
          security at{' '}
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            myaccount.google.com
          </a>
          .
        </p>
      </div>
    </div>

    {/* Two-Factor Authentication (managed via Google) */}
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
          <p className="text-sm text-gray-600">
            2FA is managed through your Google account.
          </p>
        </div>
        <a
          href="https://myaccount.google.com/two-step-verification"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" type="button">Manage via Google</Button>
        </a>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Lint check**

```bash
npx eslint src/pages/settings/index.jsx --max-warnings 0
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/settings/index.jsx
git commit -m "feat(auth): replace password-change form in Settings with Google sign-in info"
```

---

### Task 15: End-to-end smoke test checklist

Manually verify the complete flow before declaring done.

- [ ] **Step 1: Start all services**

```bash
# Terminal 1 — Backend
cd services/player-service && mvn spring-boot:run

# Terminal 2 — Frontend
npm run dev
```

- [ ] **Step 2: Run through each scenario**

| Scenario | Steps | Expected |
|---|---|---|
| **Happy path login** | Go to `http://localhost:5173/user-authentication`, click "Continue with Google", complete Google sign-in | Redirected to `/`, user name visible in header |
| **Redirect-back after login** | Go to `http://localhost:5173/settings` while logged out | Redirected to `/user-authentication?from=%2Fsettings`; after sign-in, lands on `/settings` |
| **Protected route (logged in)** | While logged in, navigate to `/profile` | Page renders normally |
| **Protected route (logged out)** | Clear localStorage, navigate to `/profile` | Redirected to sign-in page |
| **OAuth error handling** | Manually navigate to `/oauth/callback` without `?code=` | Redirected to `/user-authentication?error=no_code` with friendly error message |
| **Session persists on reload** | Log in, reload the page | Still logged in (user loaded from localStorage + verified via `/me`) |
| **Logout** | Click logout | Tokens cleared, user set to null, redirect to home or sign-in |
| **Expired token recovery** | Manually set an expired JWT in localStorage, reload | Auto-refresh triggered; if refresh token valid, user stays logged in |
| **CORS (production simulation)** | Set `CORS_ALLOWED_ORIGINS=https://example.com` env var, restart backend, make request from `localhost:5173` | Request blocked with CORS error (expected) |

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat(auth): complete Google-only authentication — production ready"
```

---

## Production Deployment Checklist

Before deploying to production, ensure these environment variables are set:

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | Min 32 chars, random, base64 | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `260337...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-...` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated prod domains | `https://topplayersofallsports.com` |
| `VITE_GOOGLE_CLIENT_ID` | Same as above (frontend build-time) | `260337...apps.googleusercontent.com` |
| `VITE_PLAYER_API_URL` | Backend URL seen by browser | `https://api.topplayersofallsports.com` |

**Additional hardening before production:**
- `JWT_SECRET` must be cryptographically random and at least 32 bytes: `openssl rand -base64 32`
- Move `GOOGLE_CLIENT_ID` behind `${GOOGLE_CLIENT_ID}` in `application.yml` (real client ID is currently hardcoded in source — remove the hardcoded default)
- Remove `VITE_GOOGLE_CLIENT_SECRET` from `.env` entirely — it is never needed frontend-side
- All timestamps in `RefreshToken.expiresAt` use `LocalDateTime` (JVM-local). Ensure JVM and PostgreSQL both run in UTC (`-Duser.timezone=UTC` JVM arg and `timezone=UTC` in PG config) to avoid cleanup-cron firing at wrong time
- Set `spring.jpa.hibernate.ddl-auto: validate` in the production profile after V6 migration confirms tables are correct — this prevents Hibernate from modifying the schema unilaterally in production
