package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.AuthResponse;
import com.topplayersofallsports.playerservice.entity.RefreshToken;
import com.topplayersofallsports.playerservice.entity.User;
import com.topplayersofallsports.playerservice.exception.AuthException;
import com.topplayersofallsports.playerservice.repository.RefreshTokenRepository;
import com.topplayersofallsports.playerservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final GoogleOAuthService googleOAuthService;

    @Value("${jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Transactional
    public AuthResponse authenticateWithGoogle(String code, String redirectUri) {
        Map<String, Object> googleUser;
        try {
            googleUser = googleOAuthService.exchangeCodeForUserInfo(code, redirectUri);
        } catch (Exception e) {
            log.warn("Google OAuth failed: {}", e.getMessage());
            throw new AuthException("Google authentication failed");
        }

        String googleId = (String) googleUser.get("id");
        String email    = (String) googleUser.get("email");
        String name     = (String) googleUser.get("name");

        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .map(existing -> {
                            existing.setGoogleId(googleId);
                            return userRepository.save(existing);
                        })
                        .orElseGet(() -> userRepository.save(User.builder()
                                .email(email)
                                .name(name)
                                .googleId(googleId)
                                .build())));

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new AuthException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new AuthException("Refresh token expired — please sign in again");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new AuthException("User not found"));

        // Rotate: delete consumed token, issue a fresh one
        refreshTokenRepository.delete(refreshToken);
        refreshTokenRepository.flush();   // ensure DELETE committed before INSERT to avoid UK conflict

        RefreshToken newRefreshToken = refreshTokenRepository.save(RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(user.getId())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .build());

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue)
                .ifPresent(refreshTokenRepository::delete);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name());

        refreshTokenRepository.deleteAllByUserId(user.getId());

        RefreshToken refreshToken = refreshTokenRepository.save(RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(user.getId())
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }
}
