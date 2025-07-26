package com.topplayersofallsports.backend.security.oauth2;

import com.topplayersofallsports.backend.model.User;
import com.topplayersofallsports.backend.service.JwtService;
import com.topplayersofallsports.backend.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * OAuth2 authentication success handler
 * Handles successful OAuth2 authentication and generates JWT tokens
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.frontend.baseUrl:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    @SuppressWarnings("unchecked")
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                      Authentication authentication) throws IOException, ServletException {
        
        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect to OAuth2 success URL");
            return;
        }

        try {
            // Extract user information from OAuth2 authentication
            Map<String, Object> attributes = (Map<String, Object>) authentication.getPrincipal();
            
            String email = (String) attributes.get("email");
            String firstName = (String) attributes.get("given_name");
            String lastName = (String) attributes.get("family_name");
            String picture = (String) attributes.get("picture");
            
            if (email == null) {
                // Try alternative attribute names
                email = (String) attributes.get("login");
            }
            
            log.info("OAuth2 authentication successful for user: {}", email);
            
            // Get or create user
            User user = getOrCreateUser(email, firstName, lastName, picture);
            
            // Generate JWT tokens
            String accessToken = jwtService.generateToken(user.getEmail());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());
            
            // Build redirect URL with tokens
            String redirectUrl = buildRedirectUrl(accessToken, refreshToken);
            
            log.debug("Redirecting OAuth2 user to: {}", redirectUrl);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            
        } catch (Exception e) {
            log.error("OAuth2 authentication success handling failed", e);
            
            // Redirect to error page with error message
            String errorUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl + "/auth/error")
                .queryParam("error", URLEncoder.encode("Authentication processing failed", StandardCharsets.UTF_8))
                .toUriString();
            
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
        }
    }

    /**
     * Get existing user or create new user from OAuth2 data
     */
    private User getOrCreateUser(String email, String firstName, String lastName, String picture) {
        try {
            // Try to find existing user
            Optional<User> existingUserOpt = userService.findByEmail(email);
            if (existingUserOpt.isPresent()) {
                User existingUser = existingUserOpt.get();
                // Update avatar if needed
                boolean updated = false;
                if (picture != null && !picture.equals(existingUser.getAvatarUrl())) {
                    existingUser.setAvatarUrl(picture);
                    updated = true;
                }
                if (updated) {
                    existingUser = userService.updateUser(existingUser.getId(), existingUser);
                }
                return existingUser;
            }
            
            // Create new user
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFirstName(firstName != null ? firstName : "");
            newUser.setLastName(lastName != null ? lastName : "");
            newUser.setAvatarUrl(picture);
            newUser.setIsActive(true);
            newUser.setIsVerified(true); // OAuth2 emails are already verified
            newUser.setProvider("google");
            newUser.setRole(User.UserRole.USER);
            // OAuth2 users don't have a password in our system
            newUser.setPassword(passwordEncoder.encode(generateRandomPassword()));
            
            return userService.createUser(newUser);
            
        } catch (Exception e) {
            log.error("Failed to get or create OAuth2 user: {}", email, e);
            throw new RuntimeException("Failed to process OAuth2 user", e);
        }
    }
    
    /**
     * Generate a random password for OAuth2 users (they won't use it)
     */
    private String generateRandomPassword() {
        return java.util.UUID.randomUUID().toString();
    }

    /**
     * Build frontend redirect URL with tokens
     */
    private String buildRedirectUrl(String accessToken, String refreshToken) {
        return UriComponentsBuilder.fromUriString(frontendBaseUrl + "/auth/callback")
            .queryParam("access_token", accessToken)
            .queryParam("refresh_token", refreshToken)
            .queryParam("token_type", "Bearer")
            .queryParam("expires_in", "86400")
            .toUriString();
    }
}
