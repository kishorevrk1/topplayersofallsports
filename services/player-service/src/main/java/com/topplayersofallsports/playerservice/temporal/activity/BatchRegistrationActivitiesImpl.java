package com.topplayersofallsports.playerservice.temporal.activity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.dto.DuplicateCheckResult;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.service.PlayerDeduplicationService;
import io.temporal.activity.Activity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class BatchRegistrationActivitiesImpl implements BatchRegistrationActivities {
    
    private final OpenRouterClient openRouterClient;
    private final PlayerRepository playerRepository;
    private final PlayerDeduplicationService deduplicationService;
    private final ObjectMapper objectMapper;
    
    @Override
    public List<String> generateTopPlayersList(String sport, int count, String source) {
        log.info("Activity: Generating top {} players list for {} from {}", count, sport, source);
        
        try {
            // Use AI to generate top players list
            String prompt = String.format("""
                You are a sports data expert. Generate a list of the top %d current %s players in the world as of 2024-2025 season.
                
                CRITICAL REQUIREMENTS:
                - Include only ACTIVE professional players
                - Use their FULL official names (e.g., "Lionel Andrés Messi Cuccittini" not just "Lionel Messi")
                - Mix of established stars and emerging talents
                - Include players from different leagues/countries
                - Return ONLY a JSON array of names, nothing else
                
                Format:
                ["Full Player Name 1", "Full Player Name 2", "Full Player Name 3", ...]
                
                Return exactly %d player names.
                """, count, sport, count);
            
            String aiResponse = openRouterClient.chat(prompt);
            
            // Extract JSON array from response
            String jsonArray = extractJsonArray(aiResponse);
            
            // Parse JSON to List<String>
            List<String> playerNames = objectMapper.readValue(
                jsonArray, 
                new TypeReference<List<String>>() {}
            );
            
            log.info("AI generated {} players for {}", playerNames.size(), sport);
            return playerNames;
            
        } catch (Exception e) {
            log.error("Error generating top players list: {}", e.getMessage(), e);
            
            // Retry logic for rate limits
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                throw Activity.wrap(new RuntimeException("OpenRouter rate limit, retrying..."));
            }
            
            throw Activity.wrap(e);
        }
    }
    
    @Override
    public List<String> filterExistingPlayers(List<String> playerNames, String sport) {
        log.info("Activity: Filtering {} players for duplicates in {} using advanced deduplication", 
                playerNames.size(), sport);
        
        try {
            List<String> newPlayers = new ArrayList<>();
            int skipped = 0;
            int aliasAdded = 0;
            
            Sport sportEnum = Sport.valueOf(sport);
            
            for (String playerName : playerNames) {
                String trimmedName = playerName.trim();
                
                // Use comprehensive deduplication check
                DuplicateCheckResult result = deduplicationService.checkForDuplicate(
                    trimmedName, 
                    sportEnum, 
                    null, // nationality unknown at this stage
                    null  // DOB unknown at this stage
                );
                
                if (result.isDuplicate()) {
                    skipped++;
                    log.info("Duplicate detected: {} -> {} (confidence: {}, reason: {})", 
                            trimmedName, result.getMatchedPlayerName(), 
                            result.getConfidence(), result.getReason());
                    
                    // Add as alias if it's a different name
                    if (result.getMatchedPlayerId() != null) {
                        Player existingPlayer = playerRepository.findById(result.getMatchedPlayerId())
                            .orElse(null);
                        
                        if (existingPlayer != null && 
                            !existingPlayer.getAliases().contains(trimmedName) &&
                            !trimmedName.equalsIgnoreCase(existingPlayer.getName())) {
                            
                            existingPlayer.getAliases().add(trimmedName);
                            playerRepository.save(existingPlayer);
                            aliasAdded++;
                            log.info("Added '{}' as alias for player: {}", 
                                    trimmedName, existingPlayer.getName());
                        }
                    }
                } else {
                    // New player - add to registration list
                    newPlayers.add(trimmedName);
                    log.debug("New player to register: {}", trimmedName);
                }
            }
            
            log.info("Deduplication complete: {} new, {} duplicates skipped, {} aliases added", 
                    newPlayers.size(), skipped, aliasAdded);
            return newPlayers;
            
        } catch (Exception e) {
            log.error("Error filtering existing players: {}", e.getMessage(), e);
            throw Activity.wrap(e);
        }
    }
    
    @Override
    public boolean canStartBatchRegistration(String sport) {
        log.info("Activity: Checking if batch registration can start for {}", sport);
        
        try {
            // Check if there's already a running batch for this sport
            // (You can add more sophisticated checks here)
            
            // For now, always allow
            return true;
            
        } catch (Exception e) {
            log.error("Error checking batch registration eligibility: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Extract JSON array from AI response that may contain thinking/explanation text
     */
    private String extractJsonArray(String aiResponse) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return "[]";
        }
        
        // Find first [ and last ]
        int firstBracket = aiResponse.indexOf('[');
        int lastBracket = aiResponse.lastIndexOf(']');
        
        if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket) {
            String extracted = aiResponse.substring(firstBracket, lastBracket + 1);
            log.debug("Extracted JSON array from AI response (length: {} -> {})", 
                     aiResponse.length(), extracted.length());
            return extracted;
        }
        
        // If no array found, try to find it in code blocks
        if (aiResponse.contains("```json")) {
            int start = aiResponse.indexOf("```json") + 7;
            int end = aiResponse.indexOf("```", start);
            if (end > start) {
                return aiResponse.substring(start, end).trim();
            }
        }
        
        log.warn("Could not extract JSON array from AI response, returning as-is");
        return aiResponse.trim();
    }
}
