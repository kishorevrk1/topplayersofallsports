package com.topplayersofallsports.playerservice;

import com.topplayersofallsports.playerservice.controller.PlayerController;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.AIAnalysisRepository;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.service.JwtService;
import com.topplayersofallsports.playerservice.service.PlayerService;
import com.topplayersofallsports.playerservice.service.PlayerRegistrationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for PlayerController
 */
@WebMvcTest(PlayerController.class)
@WithMockUser
class PlayerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PlayerService playerService;

    @MockBean
    private PlayerRegistrationService playerRegistrationService;

    @MockBean
    private PlayerRepository playerRepository;

    @MockBean
    private AIAnalysisRepository aiAnalysisRepository;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/players should return players list")
    void getPlayersBySport_ReturnsOk() throws Exception {
        // Arrange
        Player player = Player.builder()
            .id(1L)
            .name("Test Player")
            .sport(Sport.FOOTBALL)
            .build();
        when(playerService.getPlayersBySport(Sport.FOOTBALL)).thenReturn(List.of(player));

        // Act & Assert
        mockMvc.perform(get("/api/players").param("sport", "FOOTBALL"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Test Player"));
    }

    @Test
    @DisplayName("GET /api/players/{id} should return player")
    void getPlayerById_ReturnsOk() throws Exception {
        // Arrange
        Player player = Player.builder()
            .id(1L)
            .name("Test Player")
            .sport(Sport.FOOTBALL)
            .build();
        when(playerRepository.findById(1L)).thenReturn(Optional.of(player));
        when(aiAnalysisRepository.findByPlayer(player)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/players/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Test Player"));
    }

    @Test
    @DisplayName("GET /api/players/{id} should return 404 when not found")
    void getPlayerById_ReturnsNotFound() throws Exception {
        // Arrange
        when(playerService.getPlayerById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/players/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/players with invalid sport should return 400")
    void getPlayersBySport_InvalidSport_ReturnsBadRequest() throws Exception {
        // Act & Assert - GlobalExceptionHandler should handle IllegalArgumentException
        mockMvc.perform(get("/api/players").param("sport", "INVALID_SPORT"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/players/search should return matching players")
    void searchPlayers_ReturnsResults() throws Exception {
        // Arrange
        Player player = Player.builder()
            .id(1L)
            .name("Lionel Messi")
            .sport(Sport.FOOTBALL)
            .build();
        when(playerService.searchPlayers("Messi")).thenReturn(List.of(player));

        // Act & Assert
        mockMvc.perform(get("/api/players/search").param("name", "Messi"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Lionel Messi"));
    }
}
