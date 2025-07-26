package com.topplayersofallsports.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.backend.dto.AuthDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for authentication endpoints
 * These tests use the full application context
 */
@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
public class AuthenticationIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    @Test
    void contextLoads() {
        // Simple test to verify the application context loads properly
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        assert mockMvc != null;
    }

    @Test
    void testInvalidLoginReturnsUnauthorized() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        
        AuthDto.LoginRequest loginRequest = new AuthDto.LoginRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRegistrationWithPasswordMismatch() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        
        AuthDto.RegisterRequest registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setFirstName("Test");
        registerRequest.setLastName("User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setConfirmPassword("differentpassword");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Passwords do not match"));
    }

    @Test
    void testOAuth2GoogleAuthorizationEndpoint() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        
        // Test that the Google OAuth2 authorization endpoint exists
        mockMvc.perform(get("/api/oauth2/authorize/google")
                        .param("redirect_uri", "http://localhost:3000/oauth2/redirect"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    void testHealthEndpoint() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        
        // Test a simple endpoint to verify the application is running
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }
}
