package com.topplayersofallsports.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.backend.dto.AuthDto;
import com.topplayersofallsports.backend.model.User;
import com.topplayersofallsports.backend.service.CustomUserDetailsService;
import com.topplayersofallsports.backend.service.JwtService;
import com.topplayersofallsports.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test cases for AuthController
 * Tests both regular authentication and OAuth2 integration
 */
@WebMvcTest(AuthController.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    private User testUser;
    private CustomUserDetailsService.CustomUserPrincipal userPrincipal;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPassword("hashedPassword");
        testUser.setIsVerified(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());

        // Create user principal
        userPrincipal = new CustomUserDetailsService.CustomUserPrincipal(testUser);
    }

    @Test
    void testSuccessfulLogin() throws Exception {
        // Arrange
        AuthDto.LoginRequest loginRequest = new AuthDto.LoginRequest();
        loginRequest.setEmail("john.doe@example.com");
        loginRequest.setPassword("password123");

        Authentication mockAuthentication = mock(Authentication.class);
        when(mockAuthentication.getPrincipal()).thenReturn(userPrincipal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuthentication);
        when(jwtService.generateToken(any(Authentication.class)))
                .thenReturn("mock.access.token");
        when(jwtService.generateRefreshToken(anyString()))
                .thenReturn("mock.refresh.token");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("mock.access.token"))
                .andExpect(jsonPath("$.refreshToken").value("mock.refresh.token"))
                .andExpect(jsonPath("$.user.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.user.firstName").value("John"))
                .andExpect(jsonPath("$.user.lastName").value("Doe"));

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(any(Authentication.class));
        verify(jwtService).generateRefreshToken("john.doe@example.com");
    }

    @Test
    void testLoginWithInvalidCredentials() throws Exception {
        // Arrange
        AuthDto.LoginRequest loginRequest = new AuthDto.LoginRequest();
        loginRequest.setEmail("john.doe@example.com");
        loginRequest.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid email or password"));
    }

    @Test
    void testSuccessfulRegistration() throws Exception {
        // Arrange
        AuthDto.RegisterRequest registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setFirstName("Jane");
        registerRequest.setLastName("Smith");
        registerRequest.setEmail("jane.smith@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setConfirmPassword("password123");

        User newUser = new User();
        newUser.setId(2L);
        newUser.setFirstName("Jane");
        newUser.setLastName("Smith");
        newUser.setEmail("jane.smith@example.com");
        newUser.setIsVerified(false);

        when(userService.findByEmail("jane.smith@example.com"))
                .thenReturn(Optional.empty());
        when(userService.createUser(any(User.class)))
                .thenReturn(newUser);
        when(jwtService.generateToken(anyString()))
                .thenReturn("mock.access.token");
        when(jwtService.generateRefreshToken(anyString()))
                .thenReturn("mock.refresh.token");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("mock.access.token"))
                .andExpect(jsonPath("$.refreshToken").value("mock.refresh.token"))
                .andExpect(jsonPath("$.user.email").value("jane.smith@example.com"))
                .andExpect(jsonPath("$.user.firstName").value("Jane"))
                .andExpect(jsonPath("$.user.lastName").value("Smith"))
                .andExpect(jsonPath("$.user.isVerified").value(false));

        verify(userService).findByEmail("jane.smith@example.com");
        verify(userService).createUser(any(User.class));
    }

    @Test
    void testRegistrationWithExistingEmail() throws Exception {
        // Arrange
        AuthDto.RegisterRequest registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("john.doe@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setConfirmPassword("password123");

        when(userService.findByEmail("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Email already exists"));

        verify(userService).findByEmail("john.doe@example.com");
        verify(userService, never()).createUser(any(User.class));
    }

    @Test
    void testRegistrationWithPasswordMismatch() throws Exception {
        // Arrange
        AuthDto.RegisterRequest registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setFirstName("Jane");
        registerRequest.setLastName("Smith");
        registerRequest.setEmail("jane.smith@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setConfirmPassword("differentpassword");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Passwords do not match"));

        verify(userService, never()).findByEmail(anyString());
        verify(userService, never()).createUser(any(User.class));
    }

    @Test
    void testLoginWithEmptyEmail() throws Exception {
        // Arrange
        AuthDto.LoginRequest loginRequest = new AuthDto.LoginRequest();
        loginRequest.setEmail(""); // Empty email
        loginRequest.setPassword("password123");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testRegistrationWithInvalidEmail() throws Exception {
        // Arrange
        AuthDto.RegisterRequest registerRequest = new AuthDto.RegisterRequest();
        registerRequest.setFirstName("John");
        registerRequest.setLastName("Doe");
        registerRequest.setEmail("invalid-email"); // Invalid email format
        registerRequest.setPassword("password123");
        registerRequest.setConfirmPassword("password123");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }
}
