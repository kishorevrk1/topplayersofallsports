package com.topplayersofallsports.playerservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
@Slf4j
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

    @SuppressWarnings("unchecked")
    public Map<String, Object> exchangeCodeForUserInfo(String code, String redirectUri) {
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

        Map<String, Object> userInfo = webClient.get()
                .uri(userInfoUrl)
                .header("Authorization", "Bearer " + googleAccessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (userInfo == null) {
            throw new RuntimeException("Failed to fetch Google user info");
        }

        log.info("Google OAuth user authenticated: {}", userInfo.get("email"));
        return userInfo;
    }
}
