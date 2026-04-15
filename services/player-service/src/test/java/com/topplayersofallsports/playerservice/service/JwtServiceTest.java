package com.topplayersofallsports.playerservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
            "test-secret-key-that-is-long-enough-for-hs256-algorithm-yes",
            900_000L
        );
    }

    @Test
    void generatesAndValidatesToken() {
        String token = jwtService.generateAccessToken("user-1", "test@example.com", "USER");
        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.getUserId(token)).isEqualTo("user-1");
        assertThat(jwtService.getRole(token)).isEqualTo("USER");
    }

    @Test
    void invalidTokenReturnsFalse() {
        assertThat(jwtService.isValid("garbage.token.here")).isFalse();
    }
}
