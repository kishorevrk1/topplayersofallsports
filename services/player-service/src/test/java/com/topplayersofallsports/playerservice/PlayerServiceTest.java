package com.topplayersofallsports.playerservice;

import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.service.PlayerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for PlayerService
 */
@SpringBootTest
@ActiveProfiles("test")
class PlayerServiceTest {

    @Autowired
    private PlayerService playerService;

    @MockBean
    private PlayerRepository playerRepository;

    private Player testPlayer;

    @BeforeEach
    void setUp() {
        testPlayer = Player.builder()
            .id(1L)
            .apiPlayerId("FOOTBALL_12345")
            .name("Lionel Messi")
            .displayName("Messi")
            .sport(Sport.FOOTBALL)
            .team("Inter Miami")
            .position("RW")
            .nationality("Argentina")
            .age(36)
            .currentRank(1)
            .rankingScore(99.5)
            .isActive(true)
            .build();
    }

    @Test
    @DisplayName("Should return players by sport")
    void getPlayersBySport_ReturnsPlayers() {
        // Arrange
        when(playerRepository.findBySportOrderByIdDesc(Sport.FOOTBALL))
            .thenReturn(List.of(testPlayer));

        // Act
        List<Player> result = playerService.getPlayersBySport(Sport.FOOTBALL);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Lionel Messi", result.get(0).getName());
    }

    @Test
    @DisplayName("Should return empty list when no players found")
    void getPlayersBySport_ReturnsEmptyList() {
        // Arrange
        when(playerRepository.findBySportOrderByIdDesc(Sport.CRICKET))
            .thenReturn(Collections.emptyList());

        // Act
        List<Player> result = playerService.getPlayersBySport(Sport.CRICKET);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should return player by ID")
    void getPlayerById_ReturnsPlayer() {
        // Arrange
        when(playerRepository.findById(1L)).thenReturn(Optional.of(testPlayer));

        // Act
        Optional<Player> result = playerService.getPlayerById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Lionel Messi", result.get().getName());
        assertEquals(Sport.FOOTBALL, result.get().getSport());
    }

    @Test
    @DisplayName("Should return empty when player not found")
    void getPlayerById_ReturnsEmpty() {
        // Arrange
        when(playerRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<Player> result = playerService.getPlayerById(999L);

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should search players by name")
    void searchPlayers_ReturnsMatchingPlayers() {
        // Arrange
        when(playerRepository.searchByName("Messi")).thenReturn(List.of(testPlayer));

        // Act
        List<Player> result = playerService.searchPlayers("Messi");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertTrue(result.get(0).getName().contains("Messi"));
    }
}
