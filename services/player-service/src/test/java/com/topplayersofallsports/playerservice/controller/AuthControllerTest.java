package com.topplayersofallsports.playerservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.dto.AuthResponse;
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

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@WithMockUser
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean AuthService authService;
    @MockBean JwtService jwtService;
    @MockBean UserRepository userRepository;

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

    @Test
    void googleCallback_withMissingCode_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(
                            Map.of("redirectUri", "http://localhost:5173/oauth/callback"))))
                .andExpect(status().isBadRequest());
    }

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
}
