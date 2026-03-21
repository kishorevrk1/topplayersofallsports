package com.topplayersofallsports.playerservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.config.SecurityConfig;
import com.topplayersofallsports.playerservice.dto.AuthResponse;
import com.topplayersofallsports.playerservice.entity.User;
import com.topplayersofallsports.playerservice.exception.AuthException;
import com.topplayersofallsports.playerservice.filter.JwtAuthFilter;
import com.topplayersofallsports.playerservice.service.AuthService;
import com.topplayersofallsports.playerservice.service.JwtService;
import com.topplayersofallsports.playerservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean AuthService authService;
    @MockBean JwtService jwtService;
    @MockBean UserRepository userRepository;

    // --- 1. Expired/invalid refresh token returns 401, not 500 ---
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

    // --- 2. Missing code in Google callback returns 400 ---
    @Test
    void googleCallback_withMissingCode_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                            Map.of("redirectUri", "http://localhost:5173/oauth/callback"))))
                .andExpect(status().isBadRequest());
    }

    // --- 3. Refresh token rotation — returned token differs from input ---
    @Test
    void refresh_returnsNewRefreshToken() throws Exception {
        AuthResponse rotatedResponse = AuthResponse.builder()
                .accessToken("new-access-token")
                .refreshToken("NEW-refresh-token")
                .userId("user-1").email("a@b.com").name("Test").role("USER")
                .build();

        when(authService.refreshAccessToken("old-refresh-token")).thenReturn(rotatedResponse);

        String body = mockMvc.perform(post("/api/auth/refresh")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("refreshToken", "old-refresh-token"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        var result = mapper.readValue(body, AuthResponse.class);
        assert !result.getRefreshToken().equals("old-refresh-token")
            : "Refresh token must be rotated — returned value must differ from the input";
    }

    // --- 4. Happy path: Google callback returns 200 with tokens ---
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

    // --- 5. Google callback: Google rejects the code -> 401 ---
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

    // --- 6. Logout always returns 204 ---
    @Test
    void logout_returns204() throws Exception {
        doNothing().when(authService).logout(any());

        mockMvc.perform(post("/api/auth/logout")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("refreshToken", "some-token"))))
                .andExpect(status().isNoContent());
    }

    // --- 7. /me with valid token returns user info ---
    @Test
    void me_withValidToken_returnsUserInfo() throws Exception {
        User user = User.builder()
                .id("user-1").email("test@example.com").name("Test User")
                .role(User.Role.USER).build();

        when(jwtService.isValid("valid-jwt-token")).thenReturn(true);
        when(jwtService.getUserId("valid-jwt-token")).thenReturn("user-1");
        when(jwtService.getRole("valid-jwt-token")).thenReturn("USER");
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer valid-jwt-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    // --- 8. /me with no auth returns 401 ---
    @Test
    void me_withNoAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    // --- 9. /me with invalid token returns 401 ---
    @Test
    void me_withInvalidToken_returns401() throws Exception {
        when(jwtService.isValid("bad-token")).thenReturn(false);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer bad-token"))
                .andExpect(status().isUnauthorized());
    }
}
