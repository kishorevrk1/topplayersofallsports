package com.topplayersofallsports.backend.controller;

import com.topplayersofallsports.backend.dto.AuthDto;
import com.topplayersofallsports.backend.dto.UserDto;
import com.topplayersofallsports.backend.model.User;
import com.topplayersofallsports.backend.security.AuthenticationRateLimiter;
import com.topplayersofallsports.backend.service.CustomUserDetailsService;
import com.topplayersofallsports.backend.service.JwtService;
import com.topplayersofallsports.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for authentication endpoints
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication and registration")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AuthController {
    
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthenticationRateLimiter rateLimiter;
    
    /**
     * User login endpoint with enhanced security
     */
    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate user and return JWT token")
    public ResponseEntity<?> login(@Valid @RequestBody AuthDto.LoginRequest loginRequest, 
                                   HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        
        // Check rate limiting
        if (!rateLimiter.isAllowed(clientIp)) {
            long remainingMinutes = rateLimiter.getRemainingLockoutMinutes(clientIp);
            log.warn("Login attempt blocked due to rate limiting from IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of(
                    "error", "Too many failed login attempts", 
                    "message", "Account temporarily locked. Try again in " + remainingMinutes + " minutes.",
                    "remainingMinutes", remainingMinutes
                ));
        }
        
        try {
            log.debug("Login attempt for user: {} from IP: {}", loginRequest.getEmail(), clientIp);
            
            // Create authentication token with request details
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail().toLowerCase().trim(),
                    loginRequest.getPassword()
                );
            
            // Set authentication details (IP, session, etc.)
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(authToken);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Update last login time
            userDetailsService.updateLastLogin(loginRequest.getEmail().toLowerCase().trim());
            
            // Generate tokens
            String accessToken = jwtService.generateToken(authentication);
            String refreshToken = jwtService.generateRefreshToken(loginRequest.getEmail());
            
            // Get user details
            CustomUserDetailsService.CustomUserPrincipal userPrincipal = 
                (CustomUserDetailsService.CustomUserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            // Convert to DTO (exclude sensitive data)
            UserDto userDto = convertToUserDto(user);
            
            // Create response
            AuthDto.AuthResponse response = new AuthDto.AuthResponse(
                accessToken, 
                refreshToken, 
                86400000L, // 24 hours in milliseconds
                userDto
            );
            
            // Record successful attempt (clears failed attempts)
            rateLimiter.recordSuccessfulAttempt(clientIp);
            
            log.info("User logged in successfully: {} from IP: {}", loginRequest.getEmail(), clientIp);
            return ResponseEntity.ok(response);
            
        } catch (BadCredentialsException e) {
            rateLimiter.recordFailedAttempt(clientIp);
            log.warn("Invalid credentials for user: {} from IP: {}", 
                loginRequest.getEmail(), clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid email or password"));
                
        } catch (DisabledException e) {
            rateLimiter.recordFailedAttempt(clientIp);
            log.warn("Account disabled for user: {} from IP: {}", 
                loginRequest.getEmail(), clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Account is disabled"));
                
        } catch (LockedException e) {
            rateLimiter.recordFailedAttempt(clientIp);
            log.warn("Account locked for user: {} from IP: {}", 
                loginRequest.getEmail(), clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Account is locked"));
                
        } catch (Exception e) {
            rateLimiter.recordFailedAttempt(clientIp);
            log.error("Login failed for user: {} from IP: {} - Error: {}", 
                loginRequest.getEmail(), clientIp, e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Authentication failed"));
        }
    }
    
    /**
     * User registration endpoint with enhanced security
     */
    @PostMapping("/register")
    @Operation(summary = "User registration", description = "Register a new user account")
    public ResponseEntity<?> register(@Valid @RequestBody AuthDto.RegisterRequest registerRequest,
                                     HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        
        // Check rate limiting for registration as well
        if (!rateLimiter.isAllowed(clientIp)) {
            long remainingMinutes = rateLimiter.getRemainingLockoutMinutes(clientIp);
            log.warn("Registration attempt blocked due to rate limiting from IP: {}", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of(
                    "error", "Too many registration attempts", 
                    "message", "Please try again in " + remainingMinutes + " minutes.",
                    "remainingMinutes", remainingMinutes
                ));
        }
        
        try {
            log.debug("Registration attempt for user: {} from IP: {}", registerRequest.getEmail(), clientIp);
            
            // Normalize and validate email
            String normalizedEmail = registerRequest.getEmail().toLowerCase().trim();
            
            // Validate password confirmation
            if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
                rateLimiter.recordFailedAttempt(clientIp);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Passwords do not match"));
            }
            
            // Additional password strength validation could be added here
            if (registerRequest.getPassword().length() < 8) {
                rateLimiter.recordFailedAttempt(clientIp);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 8 characters long"));
            }
            
            // Create user
            User user = new User();
            user.setFirstName(registerRequest.getFirstName().trim());
            user.setLastName(registerRequest.getLastName().trim());
            user.setEmail(normalizedEmail);
            user.setPassword(registerRequest.getPassword());
            user.setPhone(registerRequest.getPhone());
            user.setCountry(registerRequest.getCountry());
            user.setBio(registerRequest.getBio());
            
            User savedUser = userService.createUser(user);
            
            // Generate tokens
            String accessToken = jwtService.generateToken(savedUser.getEmail());
            String refreshToken = jwtService.generateRefreshToken(savedUser.getEmail());
            
            // Convert to DTO (exclude sensitive data)
            UserDto userDto = convertToUserDto(savedUser);
            
            // Create response
            AuthDto.AuthResponse response = new AuthDto.AuthResponse(
                accessToken, 
                refreshToken, 
                86400000L, // 24 hours in milliseconds
                userDto
            );
            
            // Record successful attempt
            rateLimiter.recordSuccessfulAttempt(clientIp);
            
            log.info("User registered successfully: {} from IP: {}", normalizedEmail, clientIp);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Email already exists")) {
                log.warn("Registration failed - email already exists: {} from IP: {}", 
                    registerRequest.getEmail(), clientIp);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email already exists"));
            }
            
            rateLimiter.recordFailedAttempt(clientIp);
            log.error("Registration failed for user: {} from IP: {} - Error: {}", 
                registerRequest.getEmail(), clientIp, e.getMessage());
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
                
        } catch (Exception e) {
            rateLimiter.recordFailedAttempt(clientIp);
            log.error("Registration failed for user: {} from IP: {} - Unexpected error: {}", 
                registerRequest.getEmail(), clientIp, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Registration failed"));
        }
    }
    
    /**
     * Refresh token endpoint
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Generate new access token using refresh token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody AuthDto.RefreshTokenRequest refreshRequest) {
        try {
            String refreshToken = refreshRequest.getRefreshToken();
            
            if (jwtService.validateToken(refreshToken)) {
                String username = jwtService.getUsernameFromToken(refreshToken);
                String newAccessToken = jwtService.generateToken(username);
                
                // Get user details
                User user = userService.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
                
                UserDto userDto = convertToUserDto(user);
                
                AuthDto.AuthResponse response = new AuthDto.AuthResponse(
                    newAccessToken, 
                    refreshToken, 
                    86400000L,
                    userDto
                );
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired refresh token");
            }
            
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Token refresh failed");
        }
    }
    
    /**
     * Logout endpoint
     */
    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Logout user and invalidate session")
    public ResponseEntity<?> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("Logged out successfully");
    }
    
    /**
     * Convert User entity to UserDto
     */
    private UserDto convertToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setBio(user.getBio());
        dto.setPhone(user.getPhone());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setCountry(user.getCountry());
        dto.setFavoriteSports(user.getFavoriteSports());
        dto.setFavoriteTeams(user.getFavoriteTeams());
        dto.setIsVerified(user.getIsVerified());
        dto.setIsActive(user.getIsActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
    
    /**
     * Initiate OAuth2 login with Google
     */
    @GetMapping("/oauth2/authorize/google")
    @Operation(summary = "OAuth2 Google login", description = "Redirect to Google OAuth2 authorization")
    public ResponseEntity<?> googleOAuth2Login() {
        // This endpoint will redirect to Google OAuth2 authorization
        // The actual redirect is handled by Spring Security OAuth2 client
        return ResponseEntity.ok(Map.of(
            "message", "Redirect to /oauth2/authorization/google",
            "authUrl", "/oauth2/authorization/google"
        ));
    }
    
    /**
     * Get client IP address from request with proxy support
     */
    private String getClientIpAddress(HttpServletRequest request) {
        return rateLimiter.getClientIpAddress(request);
    }
}
