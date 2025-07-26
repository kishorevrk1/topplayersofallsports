package com.topplayersofallsports.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2 Controller for handling OAuth2 authentication flow
 */
@RestController
@RequestMapping("/api/oauth2")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class OAuth2Controller {

    @Value("${app.oauth2.google.clientId}")
    private String googleClientId;

    @Value("${app.frontend.baseUrl:http://localhost:3000}")
    private String frontendBaseUrl;

    /**
     * Initiate Google OAuth2 authorization
     */
    @GetMapping("/authorize/google")
    public RedirectView authorizeGoogle(@RequestParam String redirect_uri, HttpServletResponse response) {
        String authUrl = "https://accounts.google.com/o/oauth2/auth" +
                "?client_id=" + googleClientId +
                "&redirect_uri=" + URLEncoder.encode("http://localhost:8080/api/oauth2/callback/google", StandardCharsets.UTF_8) +
                "&scope=" + URLEncoder.encode("openid profile email", StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&state=" + URLEncoder.encode(redirect_uri, StandardCharsets.UTF_8);

        return new RedirectView(authUrl);
    }

    /**
     * Handle OAuth2 callback - this will be implemented by Spring Security OAuth2 client
     * This endpoint is just for documentation purposes as Spring Security handles it automatically
     */
    @GetMapping("/callback/google")
    public void googleCallback(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // This is handled by Spring Security OAuth2 client automatically
        response.sendRedirect(frontendBaseUrl + "/oauth2/redirect?error=" + URLEncoder.encode("OAuth2 callback not properly configured", StandardCharsets.UTF_8));
    }
}
