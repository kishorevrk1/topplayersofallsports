package com.topplayersofallsports.playerservice.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.topplayersofallsports.playerservice.repository.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EloServiceTest {

    @Mock PlayerRepository playerRepository;
    @Mock EloMatchupRepository matchupRepository;
    @Mock RatingDayRepository ratingDayRepository;
    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;

    @InjectMocks EloService eloService;

    @Test
    void expectedScore_equalElo_returns0_5() {
        double result = eloService.expectedScore(1500, 1500);
        assertEquals(0.5, result, 0.001);
    }

    @Test
    void expectedScore_higherElo_returnsAbove0_5() {
        double result = eloService.expectedScore(1800, 1500);
        assertTrue(result > 0.5);
        assertTrue(result < 1.0);
    }

    @Test
    void expectedScore_lowerElo_returnsBelow0_5() {
        double result = eloService.expectedScore(1200, 1500);
        assertTrue(result < 0.5);
        assertTrue(result > 0.0);
    }

    @Test
    void expectedScore_symmetricPair_sumsToOne() {
        double e1 = eloService.expectedScore(1600, 1400);
        double e2 = eloService.expectedScore(1400, 1600);
        assertEquals(1.0, e1 + e2, 0.001);
    }

    @Test
    void newElo_winAsUnderdog_gainsMore() {
        double expected = eloService.expectedScore(1400, 1600);
        double eloGain = eloService.newElo(1400, expected, 1.0) - 1400;
        // Underdog win should gain more than K/2
        assertTrue(eloGain > 16);
    }

    @Test
    void newElo_winAsFavorite_gainsLess() {
        double expected = eloService.expectedScore(1600, 1400);
        double eloGain = eloService.newElo(1600, expected, 1.0) - 1600;
        // Favorite win should gain less than K/2
        assertTrue(eloGain < 16);
        assertTrue(eloGain > 0);
    }

    @Test
    void newElo_loss_decreases() {
        double expected = eloService.expectedScore(1500, 1500);
        double newElo = eloService.newElo(1500, expected, 0.0);
        assertTrue(newElo < 1500);
    }

    @Test
    void newElo_zeroSumGame() {
        double e1 = eloService.expectedScore(1600, 1400);
        double e2 = eloService.expectedScore(1400, 1600);
        // Player 1 wins
        double new1 = eloService.newElo(1600, e1, 1.0);
        double new2 = eloService.newElo(1400, e2, 0.0);
        // Total ELO should be preserved (zero-sum)
        assertEquals(3000.0, new1 + new2, 0.01);
    }
}
