# Auth + Player Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Google OAuth + JWT auth (remove Firebase), real player search, real stats tab, player comparison, and monthly ACR auto-refresh.

**Architecture:** Auth lives entirely in player-service (Spring Boot + Spring Security + jjwt). Google sends an auth code to the frontend, the frontend posts it to `/api/auth/google`, the backend exchanges it with Google and returns a JWT pair. All player features (search, stats, comparison) are new endpoints in player-service consumed by the existing React frontend.

**Tech Stack:** Java 17, Spring Boot 3.2, Spring Security 6, jjwt 0.12.5, React 18, Vite, TailwindCSS, PostgreSQL 5433, Redis 6379, Temporal 7233, API-Sports football API, OpenRouter (AI models)

---

## Phase 1 — Security Cleanup (Frontend First, No Backend Needed)

### Task 1: Remove Frontend AI Calls and Firebase

**Goal:** Eliminate all direct AI/Firebase calls from the browser. These expose API keys to every user.

**Files:**
- Delete: `src/services/openaiClient.js`
- Delete: `src/services/Authendication/firebase.js`
- Delete: `src/services/Authendication/googleAuth.js`
- Modify: `src/pages/player-profile/components/OverviewTab.jsx`
- Modify: `src/services/aiSportsService.js` (check usages first)

**Step 1: Check aiSportsService.js for all usages**

Run in project root:
```bash
grep -r "aiSportsService" src/ --include="*.jsx" --include="*.js"
```
Expected output: only `OverviewTab.jsx` imports it. If other files import it, note them before deleting.

**Step 2: Remove aiSportsService from OverviewTab.jsx**

Open `src/pages/player-profile/components/OverviewTab.jsx`.

Remove lines 3 and 9–35 (the aiSportsService import and the `generateInsights` useEffect).

Replace the entire top of the file so it looks like this:

```jsx
import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import playerApiService from '../../../services/playerApiService';
import RatingBreakdownCard from '../../../components/RatingBreakdownCard';
import RatingHistoryChart from '../../../components/RatingHistoryChart';

const OverviewTab = ({ player }) => {
  const [ratingBreakdown, setRatingBreakdown] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [loadingRating, setLoadingRating] = useState(false);

  useEffect(() => {
    const fetchRatingData = async () => {
      if (!player?.id) return;
      setLoadingRating(true);
      try {
        const [breakdown, history] = await Promise.allSettled([
          playerApiService.getRatingBreakdown(player.id),
          playerApiService.getRatingHistory(player.id),
        ]);
        if (breakdown.status === 'fulfilled') setRatingBreakdown(breakdown.value);
        if (history.status === 'fulfilled') setRatingHistory(history.value?.history || []);
      } catch (error) {
        console.error('Error fetching rating data:', error);
      } finally {
        setLoadingRating(false);
      }
    };
    fetchRatingData();
  }, [player?.id]);
```

Also remove the "AI Player Analysis" section (the `<div className="bg-accent/5...">` block, roughly lines 62–100 of the original file). The biography section below it already shows the player bio from the backend.

**Step 3: Delete the files**

```bash
rm src/services/openaiClient.js
rm src/services/Authendication/firebase.js
rm src/services/Authendication/googleAuth.js
rm src/services/aiSportsService.js
```

**Step 4: Check for remaining Firebase/OpenAI imports anywhere**

```bash
grep -r "firebase\|openaiClient\|aiSportsService\|import.*firebase" src/ --include="*.jsx" --include="*.js"
```

Fix any remaining references found.

**Step 5: Verify frontend starts cleanly**

```bash
npm run dev
```

Open http://localhost:3000/player-profile/1 — the Overview tab should load without any console errors about Firebase or OpenAI.

**Step 6: Commit**

```bash
git add src/pages/player-profile/components/OverviewTab.jsx
git add -u  # stage the deletions
git commit -m "security: remove Firebase and direct AI calls from frontend

All AI calls now go through backend services only.
No API keys are exposed in browser-side code."
```

---

## Phase 2 — Backend Auth (player-service)

### Task 2: Add Auth Dependencies to pom.xml

**Files:**
- Modify: `services/player-service/pom.xml`

**Step 1: Open pom.xml and add these dependencies inside `<dependencies>`**

```xml
<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>

<!-- WebClient for calling Google APIs -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

**Step 2: Verify build still compiles**

```bash
cd services/player-service
mvn compile -q
```

Expected: BUILD SUCCESS. If Spring Security auto-configures and breaks tests, that's OK — we fix SecurityConfig in Task 6.

**Step 3: Commit**

```bash
git add services/player-service/pom.xml
git commit -m "deps: add Spring Security and jjwt to player-service"
```

---

### Task 3: Add Auth Config to application.yml

**Files:**
- Modify: `services/player-service/src/main/resources/application.yml`

**Step 1: Add this block to the end of application.yml**

```yaml
# ── Google OAuth2 ──────────────────────────────────────────
google:
  oauth2:
    client-id: ${GOOGLE_CLIENT_ID}
    client-secret: ${GOOGLE_CLIENT_SECRET}
    token-url: https://oauth2.googleapis.com/token
    user-info-url: https://www.googleapis.com/oauth2/v1/userinfo

# ── JWT ────────────────────────────────────────────────────
jwt:
  secret: ${JWT_SECRET}
  access-token-expiry-ms: 900000      # 15 minutes
  refresh-token-expiry-ms: 604800000  # 7 days
```

**Step 2: Set environment variables locally**

On Windows (PowerShell — run once per session, or add to your shell profile):
```powershell
$env:GOOGLE_CLIENT_ID = "260337926756-2ns89nhhhmkfbe32ccl2neh0k3detgsd.apps.googleusercontent.com"
$env:GOOGLE_CLIENT_SECRET = "your-google-client-secret-here"
$env:JWT_SECRET = "your-super-secret-key-at-least-32-characters-long-here"
```

> **Where to find GOOGLE_CLIENT_SECRET:** Go to console.cloud.google.com → APIs & Services → Credentials → Your OAuth 2.0 Client → copy the secret.

> **JWT_SECRET:** Generate a random 256-bit key: `openssl rand -base64 32` or any 32+ char random string.

**Step 3: Commit**

```bash
git add services/player-service/src/main/resources/application.yml
git commit -m "config: add Google OAuth2 and JWT settings to player-service"
```

---

### Task 4: Create User and RefreshToken Entities

**Files:**
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/User.java`
- Create: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/RefreshToken.java`

**Step 1: Create User.java**

```java
package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        USER, ADMIN
    }
}
```

**Step 2: Create RefreshToken.java**

```java
package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String token;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
```

**Step 3: Compile to catch errors**

```bash
cd services/player-service
mvn compile -q
```

**Step 4: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/User.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/RefreshToken.java
git commit -m "feat: add User and RefreshToken entities for auth"
```

---

### Task 5: Create Auth Repositories and DTOs

**Files:**
- Create: `...repository/UserRepository.java`
- Create: `...repository/RefreshTokenRepository.java`
- Create: `...dto/AuthResponse.java`
- Create: `...dto/GoogleCallbackRequest.java`

**Step 1: Create UserRepository.java**

```java
package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
}
```

**Step 2: Create RefreshTokenRepository.java**

```java
package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.userId = :userId")
    void deleteAllByUserId(String userId);
}
```

**Step 3: Create AuthResponse.java**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String userId;
    private String email;
    private String name;
    private String role;
}
```

**Step 4: Create GoogleCallbackRequest.java**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Data;

@Data
public class GoogleCallbackRequest {
    private String code;
    private String redirectUri;
}
```

**Step 5: Compile**

```bash
mvn compile -q
```

**Step 6: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/AuthResponse.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/GoogleCallbackRequest.java
git commit -m "feat: add auth repositories and DTOs"
```

---

### Task 6: Create JwtService

**Files:**
- Create: `...service/JwtService.java`

**Step 1: Create JwtService.java**

```java
package com.topplayersofallsports.playerservice.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Service
@Slf4j
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiryMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiry-ms}") long accessTokenExpiryMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiryMs = accessTokenExpiryMs;
    }

    public String generateAccessToken(String userId, String email, String role) {
        return Jwts.builder()
                .subject(userId)
                .claims(Map.of("email", email, "role", role))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiryMs))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    public String getUserId(String token) {
        return parseToken(token).getSubject();
    }

    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }
}
```

**Step 2: Write a unit test**

Create file: `services/player-service/src/test/java/com/topplayersofallsports/playerservice/service/JwtServiceTest.java`

```java
package com.topplayersofallsports.playerservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // 32+ char secret for HS256
        jwtService = new JwtService(
            "test-secret-key-that-is-long-enough-for-hs256",
            900_000L // 15 minutes
        );
    }

    @Test
    void generatesAndValidatesToken() {
        String token = jwtService.generateAccessToken("user-1", "test@example.com", "USER");

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.getUserId(token)).isEqualTo("user-1");
        assertThat(jwtService.getRole(token)).isEqualTo("USER");
    }

    @Test
    void invalidTokenReturnsFalse() {
        assertThat(jwtService.isValid("garbage.token.here")).isFalse();
    }
}
```

**Step 3: Run the test**

```bash
cd services/player-service
mvn test -pl . -Dtest=JwtServiceTest -q
```

Expected: `Tests run: 2, Failures: 0, Errors: 0`

**Step 4: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/JwtService.java
git add services/player-service/src/test/java/com/topplayersofallsports/playerservice/service/JwtServiceTest.java
git commit -m "feat: add JwtService with token generation and validation"
```

---

### Task 7: Create GoogleOAuthService

**Files:**
- Create: `...service/GoogleOAuthService.java`

**Step 1: Create GoogleOAuthService.java**

```java
package com.topplayersofallsports.playerservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final WebClient webClient = WebClient.create();

    @Value("${google.oauth2.client-id}")
    private String clientId;

    @Value("${google.oauth2.client-secret}")
    private String clientSecret;

    @Value("${google.oauth2.token-url}")
    private String tokenUrl;

    @Value("${google.oauth2.user-info-url}")
    private String userInfoUrl;

    /**
     * Exchange the Google auth code for an access token, then fetch the user's profile.
     *
     * @return Map with keys: id, email, name
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> exchangeCodeForUserInfo(String code, String redirectUri) {
        // Step 1: exchange code for Google access token
        Map<String, Object> tokenResponse = webClient.post()
                .uri(tokenUrl)
                .body(BodyInserters.fromFormData("code", code)
                        .with("client_id", clientId)
                        .with("client_secret", clientSecret)
                        .with("redirect_uri", redirectUri)
                        .with("grant_type", "authorization_code"))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            throw new RuntimeException("Failed to exchange Google auth code for token");
        }

        String googleAccessToken = (String) tokenResponse.get("access_token");

        // Step 2: fetch user info with the Google access token
        Map<String, Object> userInfo = webClient.get()
                .uri(userInfoUrl)
                .header("Authorization", "Bearer " + googleAccessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (userInfo == null) {
            throw new RuntimeException("Failed to fetch Google user info");
        }

        log.info("Google OAuth user: {}", userInfo.get("email"));
        return userInfo;
    }
}
```

**Step 2: Compile**

```bash
mvn compile -q
```

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/GoogleOAuthService.java
git commit -m "feat: add GoogleOAuthService for code exchange and user info fetch"
```

---

### Task 8: Create AuthService

**Files:**
- Create: `...service/AuthService.java`

**Step 1: Create AuthService.java**

```java
package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.AuthResponse;
import com.topplayersofallsports.playerservice.entity.RefreshToken;
import com.topplayersofallsports.playerservice.entity.User;
import com.topplayersofallsports.playerservice.repository.RefreshTokenRepository;
import com.topplayersofallsports.playerservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final GoogleOAuthService googleOAuthService;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResponse authenticateWithGoogle(String code, String redirectUri) {
        Map<String, Object> googleUser = googleOAuthService.exchangeCodeForUserInfo(code, redirectUri);

        String googleId = (String) googleUser.get("id");
        String email    = (String) googleUser.get("email");
        String name     = (String) googleUser.get("name");

        // Find existing user by googleId or email, or create new
        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existing -> {
                            existing.setGoogleId(googleId);
                            return userRepository.save(existing);
                        })
                        .orElseGet(() -> userRepository.save(User.builder()
                                .email(email)
                                .name(name)
                                .googleId(googleId)
                                .build())));

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expired — please sign in again");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshTokenValue) // reuse same refresh token
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        // Delete old refresh tokens for this user and create a new one
        refreshTokenRepository.deleteAllByUserId(user.getId());
        RefreshToken refreshToken = refreshTokenRepository.save(RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(user.getId())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }
}
```

**Step 2: Compile**

```bash
mvn compile -q
```

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/AuthService.java
git commit -m "feat: add AuthService for Google OAuth login, token refresh, and logout"
```

---

### Task 9: Create AuthController

**Files:**
- Create: `...controller/AuthController.java`

**Step 1: Create AuthController.java**

```java
package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.AuthResponse;
import com.topplayersofallsports.playerservice.dto.GoogleCallbackRequest;
import com.topplayersofallsports.playerservice.entity.User;
import com.topplayersofallsports.playerservice.repository.UserRepository;
import com.topplayersofallsports.playerservice.service.AuthService;
import com.topplayersofallsports.playerservice.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * POST /api/auth/google
     * Body: { "code": "google-auth-code", "redirectUri": "http://localhost:3000/oauth/callback" }
     * Response: { accessToken, refreshToken, userId, email, name, role }
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleCallbackRequest request) {
        log.info("Google OAuth callback received");
        AuthResponse response = authService.authenticateWithGoogle(request.getCode(), request.getRedirectUri());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/refresh
     * Body: { "refreshToken": "uuid-refresh-token" }
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AuthResponse response = authService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/logout
     * Body: { "refreshToken": "uuid-refresh-token" }
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/auth/me
     * Requires: Authorization: Bearer <accessToken>
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        String token = authHeader.substring(7);
        if (!jwtService.isValid(token)) {
            return ResponseEntity.status(401).build();
        }
        String userId = jwtService.getUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole().name()
        ));
    }
}
```

**Step 2: Compile**

```bash
mvn compile -q
```

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AuthController.java
git commit -m "feat: add AuthController with /api/auth/google, /refresh, /logout, /me"
```

---

### Task 10: Create SecurityConfig and JwtAuthFilter

**Files:**
- Create: `...config/SecurityConfig.java`
- Create: `...filter/JwtAuthFilter.java`

**Step 1: Create JwtAuthFilter.java**

First create the directory: `src/main/java/com/topplayersofallsports/playerservice/filter/`

```java
package com.topplayersofallsports.playerservice.filter;

import com.topplayersofallsports.playerservice.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtService.isValid(token)) {
                String userId = jwtService.getUserId(token);
                String role   = jwtService.getRole(token);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                userId, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + role)));

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        chain.doFilter(request, response);
    }
}
```

**Step 2: Create SecurityConfig.java**

```java
package com.topplayersofallsports.playerservice.config;

import com.topplayersofallsports.playerservice.filter.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Auth endpoints: public
                .requestMatchers("/api/auth/**").permitAll()
                // Player browsing: public reads
                .requestMatchers(HttpMethod.GET, "/api/players/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/search/**").permitAll()
                // Swagger/Actuator: public
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/health").permitAll()
                // Admin: requires ADMIN role
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Everything else: requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:5173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

**Step 3: Compile and start the service**

```bash
mvn compile -q
mvn spring-boot:run
```

Watch for startup errors. If Spring Security rejects existing endpoints, check the SecurityConfig permitAll rules.

**Step 4: Test auth endpoint manually**

```bash
# Should return 401 (no token)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8084/api/auth/me

# Should return 200 (public endpoint)
curl -s -o /dev/null -w "%{http_code}" http://localhost:8084/api/players/top?sport=FOOTBALL
```

Expected: `401` and `200`

**Step 5: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/filter/
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/SecurityConfig.java
git commit -m "feat: add Spring Security with JWT filter and CORS config"
```

---

## Phase 3 — Auth Frontend

### Task 11: Update AuthContext and authService

**Files:**
- Modify: `src/contexts/AuthContext.jsx`
- Modify: `src/services/authService.js`
- Modify: `src/pages/oauth-callback/index.jsx`

**Step 1: Read the current AuthContext.jsx**

Open `src/contexts/AuthContext.jsx` and understand what it currently does (likely wraps Firebase). We're replacing it with JWT storage.

**Step 2: Rewrite AuthContext.jsx**

```jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch { localStorage.removeItem('auth_user'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback((authResponse) => {
    localStorage.setItem('access_token',  authResponse.accessToken);
    localStorage.setItem('refresh_token', authResponse.refreshToken);
    const userInfo = {
      id: authResponse.userId,
      email: authResponse.email,
      name: authResponse.name,
      role: authResponse.role,
    };
    localStorage.setItem('auth_user', JSON.stringify(userInfo));
    setUser(userInfo);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

**Step 3: Rewrite authService.js**

```js
const PLAYER_API = import.meta.env.VITE_PLAYER_API_URL || 'http://localhost:8084';

const authService = {
  /**
   * Called after Google redirects back with ?code=...
   * Sends the code to our backend which exchanges it with Google and returns JWT.
   */
  async loginWithGoogle(code, redirectUri) {
    const res = await fetch(`${PLAYER_API}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
    if (!res.ok) throw new Error('Google authentication failed');
    return res.json(); // { accessToken, refreshToken, userId, email, name, role }
  },

  async refreshAccessToken(refreshToken) {
    const res = await fetch(`${PLAYER_API}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    return res.json();
  },

  async logout(refreshToken) {
    await fetch(`${PLAYER_API}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  },

  async getMe() {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${PLAYER_API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  getAccessToken() {
    return localStorage.getItem('access_token');
  },
};

export default authService;
```

**Step 4: Update oauth-callback page**

Open `src/pages/oauth-callback/index.jsx`. Replace its content with:

```jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

export default function OAuthCallback() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const ran       = useRef(false);

  useEffect(() => {
    // Prevent double-execution in React StrictMode
    if (ran.current) return;
    ran.current = true;

    const params      = new URLSearchParams(window.location.search);
    const code        = params.get('code');
    const redirectUri = `${window.location.origin}/oauth/callback`;

    if (!code) {
      console.error('No auth code in callback URL');
      navigate('/user-authentication?error=no_code');
      return;
    }

    authService.loginWithGoogle(code, redirectUri)
      .then(authResponse => {
        login(authResponse);
        navigate('/');
      })
      .catch(err => {
        console.error('Auth failed:', err);
        navigate('/user-authentication?error=auth_failed');
      });
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Signing you in...</p>
      </div>
    </div>
  );
}
```

**Step 5: Update the "Sign in with Google" button in user-authentication page**

Find where the Google button is rendered in `src/pages/user-authentication/`. The button should redirect to Google's OAuth URL — NOT call Firebase:

```js
function handleGoogleSignIn() {
  const clientId    = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/oauth/callback`;
  const scope       = 'email profile';

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('access_type', 'offline');

  window.location.href = url.toString();
}
```

Attach this to the Google sign-in button's `onClick`.

**Step 6: Add Authorization header to playerApiService.js**

Open `src/services/playerApiService.js`. Find the `fetchWithCache` or base fetch function and add:

```js
function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

Then for protected calls (like `refreshRating`), include `...getAuthHeaders()` in the fetch options.

**Step 7: Test the full flow**

1. Start player-service: `mvn spring-boot:run` (in services/player-service)
2. Start frontend: `npm run dev` (in project root)
3. Go to http://localhost:3000/user-authentication
4. Click "Sign in with Google"
5. Complete Google auth
6. Should redirect to http://localhost:3000/ and show the user as logged in

**Step 8: Commit**

```bash
git add src/contexts/AuthContext.jsx
git add src/services/authService.js
git add src/pages/oauth-callback/index.jsx
git add src/pages/user-authentication/
git commit -m "feat: implement Google OAuth frontend flow with backend JWT

Removes Firebase completely. Auth code is exchanged at the backend.
JWT stored in localStorage, attached to protected API calls."
```

---

## Phase 4 — Player Search

### Task 12: Backend Search Endpoint

**Files:**
- Create: `...service/SearchService.java`
- Create: `...controller/SearchController.java`
- Create: `...dto/SearchResultsResponse.java`
- Create: `...dto/PlayerSummary.java`

**Step 1: Create PlayerSummary.java**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerSummary {
    private Long id;
    private String name;
    private String sport;
    private String team;
    private String position;
    private String nationality;
    private Integer currentRank;
    private Double aiRating;
    private String photoUrl;
}
```

**Step 2: Create SearchResultsResponse.java**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SearchResultsResponse {
    private List<PlayerSummary> players;
    private int total;
    private int page;
    private int pageSize;
    private String query;
}
```

**Step 3: Add findByQuery to PlayerRepository**

Open `...repository/PlayerRepository.java`. Add this method:

```java
@Query("SELECT p FROM Player p WHERE " +
       "(:sport IS NULL OR UPPER(CAST(p.sport AS string)) = UPPER(:sport)) AND " +
       "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
       " LOWER(p.team) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
       " LOWER(p.nationality) LIKE LOWER(CONCAT('%', :q, '%')))" +
       " ORDER BY p.currentRank ASC NULLS LAST")
Page<Player> searchPlayers(
    @Param("q") String q,
    @Param("sport") String sport,
    Pageable pageable
);
```

**Step 4: Create SearchService.java**

```java
package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.PlayerSummary;
import com.topplayersofallsports.playerservice.dto.SearchResultsResponse;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final PlayerRepository playerRepository;

    public SearchResultsResponse search(String q, String sport, int page, int size) {
        String sportParam = (sport == null || sport.isBlank() || sport.equalsIgnoreCase("all"))
                ? null : sport.toUpperCase();

        Page<Player> results = playerRepository.searchPlayers(
                q.trim(), sportParam, PageRequest.of(page, size));

        var players = results.getContent().stream()
                .map(p -> PlayerSummary.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .sport(p.getSport() != null ? p.getSport().name() : null)
                        .team(p.getTeam())
                        .position(p.getPosition())
                        .nationality(p.getNationality())
                        .currentRank(p.getCurrentRank())
                        .aiRating(p.getAiRating())
                        .photoUrl(p.getPhotoUrl())
                        .build())
                .toList();

        return SearchResultsResponse.builder()
                .players(players)
                .total((int) results.getTotalElements())
                .page(page)
                .pageSize(size)
                .query(q)
                .build();
    }
}
```

**Step 5: Create SearchController.java**

```java
package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.SearchResultsResponse;
import com.topplayersofallsports.playerservice.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * GET /api/search?q=messi&sport=FOOTBALL&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<SearchResultsResponse> search(
            @RequestParam String q,
            @RequestParam(required = false) String sport,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        if (q == null || q.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(searchService.search(q, sport, page, size));
    }
}
```

**Step 6: Test the search endpoint**

Restart player-service, then:

```bash
curl "http://localhost:8084/api/search?q=messi" | python -m json.tool
```

Expected: JSON with `players` array, `total` count, `query: "messi"`

**Step 7: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/PlayerSummary.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/SearchResultsResponse.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/SearchService.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/SearchController.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/PlayerRepository.java
git commit -m "feat: add /api/search endpoint for real player search"
```

---

### Task 13: Frontend Search Page

**Files:**
- Modify: `src/pages/search-results/index.jsx`
- Modify: `src/services/playerApiService.js`
- Modify: `src/components/ui/Header.jsx` (wire search bar)

**Step 1: Add search method to playerApiService.js**

Open `src/services/playerApiService.js` and add:

```js
async searchPlayers(q, sport = '', page = 0, size = 20) {
  const params = new URLSearchParams({ q, page, size });
  if (sport && sport !== 'all') params.set('sport', sport.toUpperCase());

  const res = await fetch(`${PLAYER_API_URL}/api/search?${params}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
},
```

**Step 2: Rewrite the search-results page core logic**

Open `src/pages/search-results/index.jsx`. Keep the existing UI structure but replace the mock data logic. Find where results are set (likely a `useState`) and update:

```jsx
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import playerApiService from '../../services/playerApiService';

// Inside the component:
const [searchParams] = useSearchParams();
const query = searchParams.get('q') || '';
const [results, setResults] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError]     = useState(null);

useEffect(() => {
  if (!query.trim()) return;
  setLoading(true);
  setError(null);
  playerApiService.searchPlayers(query)
    .then(setResults)
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, [query]);
```

Then render `results.players` in the existing PlayerCard components (they already accept player objects).

**Step 3: Wire the header search bar**

Open `src/components/ui/Header.jsx`. Find the search input and add `onSubmit` / `onKeyDown`:

```jsx
const navigate = useNavigate();
const [searchInput, setSearchInput] = useState('');

function handleSearch(e) {
  e.preventDefault();
  if (searchInput.trim()) {
    navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
  }
}
```

Attach `handleSearch` to the form's `onSubmit` and the input's `onChange` to `setSearchInput`.

**Step 4: Test in browser**

1. Go to http://localhost:3000
2. Type a player name in the header search bar and press Enter
3. Should navigate to /search?q=... and show real player results

**Step 5: Commit**

```bash
git add src/pages/search-results/index.jsx
git add src/services/playerApiService.js
git add src/components/ui/Header.jsx
git commit -m "feat: wire search results page to real /api/search endpoint

Replaces all mock data with live player search from player-service."
```

---

## Phase 5 — Stats Tab with Real Data

### Task 14: Backend Player Stats Endpoint

**Files:**
- Create: `...entity/PlayerStats.java`
- Create: `...repository/PlayerStatsRepository.java`
- Create: `...service/PlayerStatsService.java`
- Create: `...controller/PlayerStatsController.java`
- Create: `...dto/PlayerStatsResponse.java`

**Step 1: Create PlayerStats.java**

```java
package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "player_stats",
       uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "season"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private String season; // "2024", "2023", "career"

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> statsJson;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

**Step 2: Create PlayerStatsRepository.java**

```java
package com.topplayersofallsports.playerservice.repository;

import com.topplayersofallsports.playerservice.entity.PlayerStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlayerStatsRepository extends JpaRepository<PlayerStats, Long> {
    List<PlayerStats> findAllByPlayerId(Long playerId);
    Optional<PlayerStats> findByPlayerIdAndSeason(Long playerId, String season);
}
```

**Step 3: Create PlayerStatsResponse.java**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class PlayerStatsResponse {
    private Long playerId;
    private Map<String, Map<String, Object>> seasonStats; // { "2024": { goals: 30, ... } }
    private Map<String, Object> careerStats;
}
```

**Step 4: Create PlayerStatsService.java**

This service fetches from API-Sports for football players and falls back to DB for others:

```java
package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.PlayerStatsResponse;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.PlayerStats;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.repository.PlayerStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerStatsService {

    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final WebClient webClient = WebClient.create();

    @Value("${apisports.football.key:}")
    private String apiSportsKey;

    private static final String APISPORTS_BASE = "https://v3.football.api-sports.io";
    private static final List<String> SEASONS = List.of("2024", "2023", "2022", "2021", "2020");

    public PlayerStatsResponse getStats(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found: " + playerId));

        if (player.getSport() == Sport.FOOTBALL && apiSportsKey != null && !apiSportsKey.isBlank()) {
            return fetchFootballStats(player);
        }

        return fetchFromDatabase(playerId);
    }

    @SuppressWarnings("unchecked")
    private PlayerStatsResponse fetchFootballStats(Player player) {
        Map<String, Map<String, Object>> seasonStats = new LinkedHashMap<>();
        Map<String, Object> careerTotals = new LinkedHashMap<>();

        int careerGoals = 0, careerAssists = 0, careerApps = 0;

        for (String season : SEASONS) {
            try {
                Map<String, Object> response = webClient.get()
                        .uri(APISPORTS_BASE + "/players?search={name}&season={season}",
                             player.getName(), season)
                        .header("x-apisports-key", apiSportsKey)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response == null) continue;

                List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("response");
                if (data == null || data.isEmpty()) continue;

                Map<String, Object> stats = ((List<Map<String, Object>>) data.get(0).get("statistics")).get(0);
                Map<String, Object> goals   = (Map<String, Object>) stats.get("goals");
                Map<String, Object> games   = (Map<String, Object>) stats.get("games");
                Map<String, Object> passes  = (Map<String, Object>) stats.get("passes");

                int goals_scored = goals != null && goals.get("total") != null
                        ? ((Number) goals.get("total")).intValue() : 0;
                int assists = goals != null && goals.get("assists") != null
                        ? ((Number) goals.get("assists")).intValue() : 0;
                int appearances = games != null && games.get("appearences") != null
                        ? ((Number) games.get("appearences")).intValue() : 0;

                Map<String, Object> seasonData = new LinkedHashMap<>();
                seasonData.put("goals",       goals_scored);
                seasonData.put("assists",     assists);
                seasonData.put("appearances", appearances);
                seasonStats.put(season, seasonData);

                careerGoals   += goals_scored;
                careerAssists += assists;
                careerApps    += appearances;

            } catch (Exception e) {
                log.warn("Could not fetch API-Sports stats for {} season {}: {}", player.getName(), season, e.getMessage());
            }
        }

        careerTotals.put("goals",       careerGoals);
        careerTotals.put("assists",     careerAssists);
        careerTotals.put("appearances", careerApps);

        return PlayerStatsResponse.builder()
                .playerId(player.getId())
                .seasonStats(seasonStats)
                .careerStats(careerTotals)
                .build();
    }

    private PlayerStatsResponse fetchFromDatabase(Long playerId) {
        List<PlayerStats> allStats = playerStatsRepository.findAllByPlayerId(playerId);

        Map<String, Map<String, Object>> seasonStats = allStats.stream()
                .filter(s -> !s.getSeason().equals("career"))
                .collect(Collectors.toMap(PlayerStats::getSeason, PlayerStats::getStatsJson));

        Map<String, Object> careerStats = allStats.stream()
                .filter(s -> s.getSeason().equals("career"))
                .findFirst()
                .map(PlayerStats::getStatsJson)
                .orElse(Collections.emptyMap());

        return PlayerStatsResponse.builder()
                .playerId(playerId)
                .seasonStats(seasonStats)
                .careerStats(careerStats)
                .build();
    }
}
```

**Step 5: Create PlayerStatsController.java**

```java
package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.PlayerStatsResponse;
import com.topplayersofallsports.playerservice.service.PlayerStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerStatsController {

    private final PlayerStatsService playerStatsService;

    /**
     * GET /api/players/{id}/stats
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<PlayerStatsResponse> getStats(@PathVariable Long id) {
        return ResponseEntity.ok(playerStatsService.getStats(id));
    }
}
```

**Step 6: Test the stats endpoint**

```bash
# Replace 1 with a real football player ID from your DB
curl "http://localhost:8084/api/players/1/stats" | python -m json.tool
```

Expected: JSON with `seasonStats` and `careerStats` populated (or empty maps if player not in API-Sports).

**Step 7: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/entity/PlayerStats.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/repository/PlayerStatsRepository.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/PlayerStatsService.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerStatsController.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/PlayerStatsResponse.java
git commit -m "feat: add /api/players/{id}/stats with API-Sports football data"
```

---

### Task 15: Frontend Stats Tab Integration

**Files:**
- Modify: `src/pages/player-profile/index.jsx`
- Modify: `src/services/playerApiService.js`

**Step 1: Add getPlayerStats to playerApiService.js**

```js
async getPlayerStats(playerId) {
  const res = await fetch(`${PLAYER_API_URL}/api/players/${playerId}/stats`);
  if (!res.ok) throw new Error('Failed to fetch player stats');
  return res.json();
},
```

**Step 2: Fetch stats in player-profile/index.jsx**

Add a `stats` state and fetch alongside the player data. In the `useEffect` that calls `playerApiService.getPlayerById`, also call `getPlayerStats`:

```jsx
const [stats, setStats] = useState(null);

useEffect(() => {
  if (!playerId) { /* error handling */ return; }
  setLoading(true);

  Promise.allSettled([
    playerApiService.getPlayerById(playerId),
    playerApiService.getPlayerStats(playerId),
  ]).then(([playerResult, statsResult]) => {
    if (playerResult.status === 'fulfilled') {
      const raw = playerResult.value;
      const transformed = transformPlayer(raw);

      // Merge stats into player object if available
      if (statsResult.status === 'fulfilled') {
        transformed.seasonStats = statsResult.value.seasonStats || {};
        transformed.careerStats  = statsResult.value.careerStats  || {};
      }

      setPlayer(transformed);
    } else {
      setError(playerResult.reason.message);
    }
  }).finally(() => setLoading(false));
}, [playerId]);
```

**Step 3: Test in browser**

1. Go to any player profile page
2. Click the "Stats" tab
3. Should now show real numbers instead of empty

> Note: If the player is not in API-Sports (non-football or unknown name), the stats will be empty `{}` — the StatsTab already handles this gracefully (renders nothing when `Object.entries(currentStats)` is empty).

**Step 4: Commit**

```bash
git add src/pages/player-profile/index.jsx
git add src/services/playerApiService.js
git commit -m "feat: wire Stats tab to real /api/players/{id}/stats data"
```

---

## Phase 6 — Player Comparison

### Task 16: Backend Compare Endpoint

**Files:**
- Create: `...dto/ComparisonResponse.java`
- Modify: `...controller/PlayerController.java`

**Step 1: Create ComparisonResponse.java**

```java
package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ComparisonResponse {
    private PlayerWithRatingDto player1;
    private PlayerWithRatingDto player2;

    @Data
    @Builder
    public static class PlayerWithRatingDto {
        private Long id;
        private String name;
        private String sport;
        private String team;
        private String position;
        private String nationality;
        private Integer age;
        private Integer currentRank;
        private Double aiRating;
        private String photoUrl;
        private Object ratingBreakdown; // The full RatingConsensus object as JSON
    }
}
```

**Step 2: Add compare endpoint to PlayerController.java**

Open `...controller/PlayerController.java` and add:

```java
/**
 * GET /api/players/compare?p1=1&p2=2
 */
@GetMapping("/compare")
public ResponseEntity<ComparisonResponse> comparePlayers(
        @RequestParam Long p1,
        @RequestParam Long p2) {

    Player player1 = playerRepository.findById(p1)
            .orElseThrow(() -> new RuntimeException("Player not found: " + p1));
    Player player2 = playerRepository.findById(p2)
            .orElseThrow(() -> new RuntimeException("Player not found: " + p2));

    // Get rating breakdown for each (if available)
    Optional<RatingConsensus> rating1 = ratingConsensusRepository.findByPlayerId(p1);
    Optional<RatingConsensus> rating2 = ratingConsensusRepository.findByPlayerId(p2);

    return ResponseEntity.ok(ComparisonResponse.builder()
            .player1(toComparisonDto(player1, rating1.orElse(null)))
            .player2(toComparisonDto(player2, rating2.orElse(null)))
            .build());
}

private ComparisonResponse.PlayerWithRatingDto toComparisonDto(Player p, RatingConsensus rating) {
    return ComparisonResponse.PlayerWithRatingDto.builder()
            .id(p.getId())
            .name(p.getName())
            .sport(p.getSport() != null ? p.getSport().name() : null)
            .team(p.getTeam())
            .position(p.getPosition())
            .nationality(p.getNationality())
            .age(p.getAge())
            .currentRank(p.getCurrentRank())
            .aiRating(p.getAiRating())
            .photoUrl(p.getPhotoUrl())
            .ratingBreakdown(rating)
            .build();
}
```

**Step 3: Test the compare endpoint**

```bash
curl "http://localhost:8084/api/players/compare?p1=1&p2=2" | python -m json.tool
```

Expected: JSON with `player1` and `player2` objects, each with their rating breakdown.

**Step 4: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/dto/ComparisonResponse.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/PlayerController.java
git commit -m "feat: add GET /api/players/compare?p1=&p2= endpoint"
```

---

### Task 17: Frontend Comparison Page

**Files:**
- Create: `src/pages/player-comparison/index.jsx`
- Modify: `src/App.jsx` (add route)
- Modify: `src/pages/player-profile/index.jsx` (wire Compare button)
- Modify: `src/services/playerApiService.js` (add comparePlayer method)

**Step 1: Add comparePlayer to playerApiService.js**

```js
async comparePlayer(p1Id, p2Id) {
  const res = await fetch(`${PLAYER_API_URL}/api/players/compare?p1=${p1Id}&p2=${p2Id}`);
  if (!res.ok) throw new Error('Comparison failed');
  return res.json();
},
```

**Step 2: Create src/pages/player-comparison/index.jsx**

```jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import playerApiService from '../../services/playerApiService';

function CriterionBar({ label, score1, score2, maxScore }) {
  const pct1 = Math.round((score1 / maxScore) * 100);
  const pct2 = Math.round((score2 / maxScore) * 100);
  const winner = score1 > score2 ? 'left' : score2 > score1 ? 'right' : 'tie';

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-text-secondary mb-1">
        <span className={winner === 'left' ? 'text-accent font-bold' : ''}>{score1 ?? '—'}</span>
        <span className="font-medium text-text-primary">{label}</span>
        <span className={winner === 'right' ? 'text-accent font-bold' : ''}>{score2 ?? '—'}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted gap-0.5">
        <div className="flex-1 flex justify-end">
          <div
            className={`h-full rounded-l-full ${winner === 'left' ? 'bg-accent' : 'bg-blue-400'}`}
            style={{ width: `${pct1}%` }}
          />
        </div>
        <div className="flex-1">
          <div
            className={`h-full rounded-r-full ${winner === 'right' ? 'bg-accent' : 'bg-blue-400'}`}
            style={{ width: `${pct2}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PlayerComparisonPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const p1Id = searchParams.get('p1');
  const p2Id = searchParams.get('p2');

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!p1Id || !p2Id) { setError('Two player IDs required'); setLoading(false); return; }
    playerApiService.comparePlayer(p1Id, p2Id)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [p1Id, p2Id]);

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
      <TabNavigation />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 text-center text-text-secondary">{error || 'Could not load comparison'}</div>
      <TabNavigation />
    </div>
  );

  const { player1, player2 } = data;

  const criteria = [
    { label: 'Peak Performance', max: 30, key: 'peakPerformance' },
    { label: 'Longevity',        max: 20, key: 'longevity' },
    { label: 'Awards & Titles',  max: 20, key: 'awardsAndTitles' },
    { label: 'Era Impact',       max: 30, key: 'eraAdjustedImpact' },
  ];

  const p1Rating = player1.ratingBreakdown;
  const p2Rating = player2.ratingBreakdown;

  function getScore(ratingBreakdown, key) {
    return ratingBreakdown?.criteriaScores?.[key] ?? null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 pb-20 lg:pb-0 max-w-5xl mx-auto px-4 py-8">

        {/* Player headers */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          <div>
            <img
              src={player1.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player1.name)}&size=100&background=random`}
              alt={player1.name}
              className="w-24 h-24 rounded-full mx-auto object-cover mb-2"
            />
            <h2 className="font-bold text-text-primary">{player1.name}</h2>
            <p className="text-sm text-text-secondary">{player1.team}</p>
            <div className="text-2xl font-bold text-accent mt-1">
              {player1.aiRating?.toFixed(1) ?? '—'}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-3xl font-black text-text-secondary">VS</span>
          </div>
          <div>
            <img
              src={player2.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(player2.name)}&size=100&background=random`}
              alt={player2.name}
              className="w-24 h-24 rounded-full mx-auto object-cover mb-2"
            />
            <h2 className="font-bold text-text-primary">{player2.name}</h2>
            <p className="text-sm text-text-secondary">{player2.team}</p>
            <div className="text-2xl font-bold text-accent mt-1">
              {player2.aiRating?.toFixed(1) ?? '—'}
            </div>
          </div>
        </div>

        {/* ACR Criteria comparison */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-text-primary mb-4">ACR Criteria Comparison</h3>
          {criteria.map(c => (
            <CriterionBar
              key={c.key}
              label={c.label}
              score1={getScore(p1Rating, c.key)}
              score2={getScore(p2Rating, c.key)}
              maxScore={c.max}
            />
          ))}
        </div>

        {/* Quick facts comparison table */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-text-primary mb-4">Quick Facts</h3>
          {[
            { label: 'Rank',        v1: player1.currentRank ? `#${player1.currentRank}` : '—', v2: player2.currentRank ? `#${player2.currentRank}` : '—' },
            { label: 'Age',         v1: player1.age ?? '—',         v2: player2.age ?? '—' },
            { label: 'Position',    v1: player1.position ?? '—',    v2: player2.position ?? '—' },
            { label: 'Nationality', v1: player1.nationality ?? '—', v2: player2.nationality ?? '—' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium text-text-primary">{row.v1}</span>
              <span className="text-xs text-text-secondary px-4">{row.label}</span>
              <span className="text-sm font-medium text-text-primary">{row.v2}</span>
            </div>
          ))}
        </div>

        {/* Share button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="px-6 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
          >
            Copy comparison link
          </button>
        </div>
      </div>
      <TabNavigation />
    </div>
  );
}
```

**Step 3: Add route to App.jsx**

Open `src/App.jsx`. Find where routes are defined and add:

```jsx
import PlayerComparisonPage from './pages/player-comparison';

// Inside <Routes>:
<Route path="/compare" element={<PlayerComparisonPage />} />
```

**Step 4: Wire the "Compare Players" button in player-profile**

Open `src/pages/player-profile/index.jsx`. Find the "Compare Players" button (line ~221) and update it:

```jsx
const navigate = useNavigate(); // already imported at top

// Replace the Compare button:
<button
  onClick={() => navigate(`/compare?p1=${player.id}`)}
  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-150 text-sm"
>
  <span>Compare Players</span>
</button>
```

> When the user clicks Compare, they'll land on `/compare?p1=123`. The comparison page needs both p1 and p2 — you can add a player search input on the comparison page (or accept that it needs both IDs in the URL). For simplest implementation, prompt the user to pick a second player from the players directory.

**Step 5: Test comparison**

1. Go to a player profile
2. Click "Compare Players"
3. Manually add `&p2=2` to the URL
4. Comparison page should load with both players side by side

**Step 6: Commit**

```bash
git add src/pages/player-comparison/index.jsx
git add src/App.jsx
git add src/pages/player-profile/index.jsx
git add src/services/playerApiService.js
git commit -m "feat: add player comparison page at /compare?p1=&p2="
```

---

## Phase 7 — Monthly ACR Auto-Refresh

### Task 18: Create MonthlyRatingRefreshWorkflow

**Files:**
- Create: `...temporal/workflow/MonthlyRatingRefreshWorkflow.java`
- Create: `...temporal/workflow/MonthlyRatingRefreshWorkflowImpl.java`
- Modify: `...config/TemporalConfig.java`
- Delete: `...temporal/workflow/DailyRatingRefreshWorkflow.java`
- Delete: `...temporal/workflow/DailyRatingRefreshWorkflowImpl.java` (if exists)

**Step 1: Check what DailyRatingRefreshWorkflow currently looks like**

Read the file:
```
services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/DailyRatingRefreshWorkflow.java
```

Note its structure (it's likely just an interface + implementation). We'll copy and rename.

**Step 2: Create MonthlyRatingRefreshWorkflow.java**

```java
package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface MonthlyRatingRefreshWorkflow {
    @WorkflowMethod
    void refreshStaleRatings();
}
```

**Step 3: Create MonthlyRatingRefreshWorkflowImpl.java**

```java
package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.RatingActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;

import java.time.Duration;
import java.util.List;

public class MonthlyRatingRefreshWorkflowImpl implements MonthlyRatingRefreshWorkflow {

    private static final Logger log = Workflow.getLogger(MonthlyRatingRefreshWorkflowImpl.class);

    private final RatingActivities activities = Workflow.newActivityStub(
            RatingActivities.class,
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(10))
                    .setRetryOptions(RetryOptions.newBuilder()
                            .setMaximumAttempts(3)
                            .build())
                    .build());

    @Override
    public void refreshStaleRatings() {
        log.info("Starting monthly rating refresh");

        // Get all player IDs where rating is older than 30 days
        List<Long> stalePlayerIds = activities.getStalePlayerIds(30);
        log.info("Found {} stale player ratings to refresh", stalePlayerIds.size());

        // Process in batches of 5 to respect API rate limits
        int batchSize = 5;
        for (int i = 0; i < stalePlayerIds.size(); i += batchSize) {
            List<Long> batch = stalePlayerIds.subList(i, Math.min(i + batchSize, stalePlayerIds.size()));

            for (Long playerId : batch) {
                try {
                    activities.refreshPlayerRating(playerId);
                    log.info("Refreshed rating for player {}", playerId);
                } catch (Exception e) {
                    log.warn("Failed to refresh rating for player {}: {}", playerId, e.getMessage());
                }
            }

            // Wait 12 seconds between batches (respects 5 req/min OpenRouter rate limit)
            if (i + batchSize < stalePlayerIds.size()) {
                Workflow.sleep(Duration.ofSeconds(12));
            }
        }

        log.info("Monthly rating refresh complete. Processed {} players", stalePlayerIds.size());
    }
}
```

**Step 4: Check if RatingActivities has getStalePlayerIds — if not, add it**

Open `...temporal/activity/RatingActivities.java`. If `getStalePlayerIds(int daysOld)` is not there, add:

```java
@ActivityInterface
public interface RatingActivities {
    List<Long> getStalePlayerIds(int daysOld);
    void refreshPlayerRating(Long playerId);
    // ... existing methods
}
```

Then in `RatingActivitiesImpl.java`, implement `getStalePlayerIds`:

```java
@Override
public List<Long> getStalePlayerIds(int daysOld) {
    LocalDateTime cutoff = LocalDateTime.now().minusDays(daysOld);
    // Players with no rating or rating older than cutoff
    return playerRepository.findAll().stream()
            .filter(p -> {
                Optional<RatingConsensus> rating = ratingConsensusRepository.findByPlayerId(p.getId());
                return rating.isEmpty() || rating.get().getUpdatedAt().isBefore(cutoff);
            })
            .map(Player::getId)
            .toList();
}
```

**Step 5: Register the workflow in TemporalConfig.java**

Open `...config/TemporalConfig.java`. Find where workflows are registered with the worker and replace `DailyRatingRefreshWorkflow` with `MonthlyRatingRefreshWorkflow`:

```java
// Remove:
.addWorkflowImplementationTypes(DailyRatingRefreshWorkflowImpl.class)

// Add:
.addWorkflowImplementationTypes(MonthlyRatingRefreshWorkflowImpl.class)
```

Also find where the workflow is scheduled (cron) and update the cron expression:

```java
// Change from daily cron (e.g., "0 2 * * *") to monthly:
.setCronSchedule("0 2 1 * *")  // 1st of every month at 2:00 AM
```

**Step 6: Compile and start service**

```bash
mvn compile -q
mvn spring-boot:run
```

Check Temporal UI at http://localhost:8088 (if Temporal Web UI is running) — you should see the `MonthlyRatingRefreshWorkflow` registered.

**Step 7: Delete old Daily workflow files**

```bash
# Only after confirming monthly workflow works
git rm services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/DailyRatingRefreshWorkflow.java
git rm services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/DailyRatingRefreshWorkflowImpl.java
```

**Step 8: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/MonthlyRatingRefreshWorkflow.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/workflow/MonthlyRatingRefreshWorkflowImpl.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/config/TemporalConfig.java
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/temporal/activity/
git commit -m "feat: switch from daily to monthly ACR rating refresh

Monthly cron (0 2 1 * *) refreshes stale ratings in batches of 5
with 12s delay between batches to respect OpenRouter rate limits."
```

---

## Final Verification Checklist

Run through this before calling this done:

```
[ ] npm run dev starts without errors or Firebase warnings
[ ] http://localhost:3000 loads the home dashboard
[ ] Player profile Overview tab loads without console errors about aiSportsService
[ ] http://localhost:8084/api/players/top?sport=FOOTBALL returns players
[ ] http://localhost:8084/api/search?q=messi returns real results
[ ] http://localhost:8084/api/players/1/stats returns stats JSON
[ ] http://localhost:8084/api/players/compare?p1=1&p2=2 returns both players
[ ] http://localhost:8084/api/auth/me returns 401 (no token)
[ ] Google sign-in flow completes and sets auth state in UI
[ ] Refresh token exchange works (POST /api/auth/refresh with valid token)
[ ] Search bar in header navigates to /search?q=... with real results
[ ] Stats tab shows real numbers (or graceful empty state)
[ ] Compare page renders both players side by side
[ ] MonthlyRatingRefreshWorkflow is registered in Temporal
[ ] No API keys remain hardcoded in application.yml (all use ${ENV_VAR})
```

---

## Commit History Summary

When complete, the branch should have these commits (in order):
1. `security: remove Firebase and direct AI calls from frontend`
2. `deps: add Spring Security and jjwt to player-service`
3. `config: add Google OAuth2 and JWT settings to player-service`
4. `feat: add User and RefreshToken entities for auth`
5. `feat: add auth repositories and DTOs`
6. `feat: add JwtService with token generation and validation`
7. `feat: add GoogleOAuthService for code exchange and user info fetch`
8. `feat: add AuthService for Google OAuth login, token refresh, and logout`
9. `feat: add AuthController with /api/auth/google, /refresh, /logout, /me`
10. `feat: add Spring Security with JWT filter and CORS config`
11. `feat: implement Google OAuth frontend flow with backend JWT`
12. `feat: add /api/search endpoint for real player search`
13. `feat: wire search results page to real /api/search endpoint`
14. `feat: add /api/players/{id}/stats with API-Sports football data`
15. `feat: wire Stats tab to real /api/players/{id}/stats data`
16. `feat: add GET /api/players/compare?p1=&p2= endpoint`
17. `feat: add player comparison page at /compare?p1=&p2=`
18. `feat: switch from daily to monthly ACR rating refresh`
