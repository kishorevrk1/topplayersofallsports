package com.topplayersofallsports.backend.security.oauth2;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2 authentication failure handler
 * Handles failed OAuth2 authentication and redirects to error page
 */
@Component
@Slf4j
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.frontend.baseUrl:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                      AuthenticationException exception) throws IOException, ServletException {
        
        log.error("OAuth2 authentication failed", exception);
        
        String errorMessage = exception.getLocalizedMessage();
        if (errorMessage == null || errorMessage.isEmpty()) {
            errorMessage = "Authentication failed";
        }
        
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl + "/auth/error")
            .queryParam("error", URLEncoder.encode(errorMessage, StandardCharsets.UTF_8))
            .toUriString();
        
        log.debug("Redirecting OAuth2 failure to: {}", redirectUrl);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
