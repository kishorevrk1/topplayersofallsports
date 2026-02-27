package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import com.topplayersofallsports.playerservice.dto.ai.PlayerSearchResult;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.Optional;

/**
 * Player Registration Service
 * Handles user-driven player registration with AI-powered search and enrichment
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerRegistrationService {
    
    private final PlayerSearchService playerSearchService;
    private final PlayerService playerService;
    private final PlayerRepository playerRepository;
    
    /**
     * Register a new player based on user request
     * Flow: AI Search → API Fetch → AI Enrich → Save
     */
    @Transactional
    public PlayerRegistrationResponse registerPlayer(PlayerRegistrationRequest request) {
        log.info("User requested player registration: {}", request.getPlayerName());
        
        try {
            // Step 1: AI Search - Validate and structure player info
            PlayerSearchResult searchResult = playerSearchService.searchPlayer(
                request.getPlayerName(),
                request.getSport(),
                buildAdditionalHints(request)
            );
            
            // Check if player is valid
            if (!searchResult.isActivePlayer()) {
                return PlayerRegistrationResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("Player not found or unable to validate")
                    .errorMessage(searchResult.getCareerSummary())
                    .build();
            }
            
            // Check if player already exists
            Optional<Player> existing = playerRepository.searchByName(searchResult.getFullName())
                .stream()
                .findFirst();
            
            if (existing.isPresent()) {
                Player existingPlayer = existing.get();
                return PlayerRegistrationResponse.builder()
                    .success(true)
                    .status("ALREADY_EXISTS")
                    .message("Player already in database")
                    .playerId(existingPlayer.getId())
                    .playerName(existingPlayer.getName())
                    .sport(existingPlayer.getSport().name())
                    .build();
            }
            
            // Step 2: Fetch from API-Sports based on AI search result
            Player registeredPlayer = null;
            
            if ("FOOTBALL".equalsIgnoreCase(searchResult.getSport())) {
                registeredPlayer = registerFootballPlayer(searchResult);
            } 
            // Add other sports here as we implement them
            // else if ("BASKETBALL".equalsIgnoreCase(searchResult.getSport())) { ... }
            
            if (registeredPlayer != null) {
                return PlayerRegistrationResponse.builder()
                    .success(true)
                    .status("NEW")
                    .message("Player successfully registered with AI analysis")
                    .playerId(registeredPlayer.getId())
                    .playerName(registeredPlayer.getName())
                    .sport(registeredPlayer.getSport().name())
                    .build();
            } else {
                return PlayerRegistrationResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("Unable to fetch player data from API")
                    .errorMessage("Sport-specific API unavailable or rate limited")
                    .build();
            }
            
        } catch (Exception e) {
            log.error("Error registering player: {}", e.getMessage(), e);
            return PlayerRegistrationResponse.builder()
                .success(false)
                .status("FAILED")
                .message("Error during player registration")
                .errorMessage(e.getMessage())
                .build();
        }
    }
    
    /**
     * Register a football player using API-Sports and AI enrichment
     */
    private Player registerFootballPlayer(PlayerSearchResult searchResult) {
        log.info("API-Sports registration disabled - use Temporal workflow for AI-only registration");
        return null; // API-Sports removed - use TemporalPlayerController endpoints instead
    }
    
    /**
     * Build additional hints from request
     */
    private String buildAdditionalHints(PlayerRegistrationRequest request) {
        StringBuilder hints = new StringBuilder();
        
        if (request.getTeam() != null && !request.getTeam().isBlank()) {
            hints.append("Team: ").append(request.getTeam()).append(". ");
        }
        
        if (request.getNationality() != null && !request.getNationality().isBlank()) {
            hints.append("Nationality: ").append(request.getNationality()).append(". ");
        }
        
        if (request.getAdditionalInfo() != null && !request.getAdditionalInfo().isBlank()) {
            hints.append(request.getAdditionalInfo());
        }
        
        return hints.toString();
    }
    
    /**
     * Fuzzy name matching
     */
    private boolean isNameMatch(String name1, String name2) {
        if (name1 == null || name2 == null) {
            return false;
        }
        
        String normalized1 = name1.toLowerCase().trim();
        String normalized2 = name2.toLowerCase().trim();
        
        // Exact match
        if (normalized1.equals(normalized2)) {
            return true;
        }
        
        // Contains match
        if (normalized1.contains(normalized2) || normalized2.contains(normalized1)) {
            return true;
        }
        
        // Split and check key parts (last name match)
        String[] parts1 = normalized1.split("\\s+");
        String[] parts2 = normalized2.split("\\s+");
        
        if (parts1.length > 0 && parts2.length > 0) {
            String lastName1 = parts1[parts1.length - 1];
            String lastName2 = parts2[parts2.length - 1];
            
            if (lastName1.equals(lastName2) && lastName1.length() > 3) {
                return true;
            }
        }
        
        return false;
    }
}
