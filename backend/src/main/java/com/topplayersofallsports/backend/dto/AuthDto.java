package com.topplayersofallsports.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for user authentication requests
 */
public class AuthDto {
    
    /**
     * Login request DTO
     */
    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;
        
        @NotBlank(message = "Password is required")
        private String password;
        
        private boolean rememberMe = false;
    }
    
    /**
     * Registration request DTO
     */
    @Data
    public static class RegisterRequest {
        @NotBlank(message = "First name is required")
        @Size(max = 50, message = "First name must be less than 50 characters")
        private String firstName;
        
        @NotBlank(message = "Last name is required")
        @Size(max = 50, message = "Last name must be less than 50 characters")
        private String lastName;
        
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        @Size(max = 100, message = "Email must be less than 100 characters")
        private String email;
        
        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;
        
        @NotBlank(message = "Password confirmation is required")
        private String confirmPassword;
        
        private String phone;
        private String country;
        private String bio;
    }
    
    /**
     * Password change request DTO
     */
    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;
        
        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String newPassword;
        
        @NotBlank(message = "Password confirmation is required")
        private String confirmPassword;
    }
    
    /**
     * Password reset request DTO
     */
    @Data
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;
    }
    
    /**
     * Authentication response DTO
     */
    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private Long expiresIn;
        private UserDto user;
        
        public AuthResponse(String accessToken, String refreshToken, Long expiresIn, UserDto user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn = expiresIn;
            this.user = user;
        }
    }
    
    /**
     * Token refresh request DTO
     */
    @Data
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }
}
