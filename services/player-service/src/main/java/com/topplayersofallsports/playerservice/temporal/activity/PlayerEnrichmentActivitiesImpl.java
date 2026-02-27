package com.topplayersofallsports.playerservice.temporal.activity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import io.temporal.activity.Activity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Implementation of Player Enrichment Activities
 * Uses AI to populate missing player data fields
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PlayerEnrichmentActivitiesImpl implements PlayerEnrichmentActivities {
    
    private final PlayerRepository playerRepository;
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    
    @Override
    public List<Long> findPlayersWithMissingData(String sport) {
        log.info("Activity: Finding players with missing data" + (sport != null ? " for " + sport : ""));
        
        try {
            List<Player> players;
            
            if (sport != null) {
                // Find players for specific sport with missing essential data
                players = playerRepository.findBySport(
                    com.topplayersofallsports.playerservice.entity.Sport.valueOf(sport.toUpperCase())
                );
            } else {
                // Find all players
                players = playerRepository.findAll();
            }
            
            // Filter players with missing data
            List<Long> playerIdsWithMissingData = new ArrayList<>();
            for (Player player : players) {
                if (hasMissingData(player)) {
                    playerIdsWithMissingData.add(player.getId());
                }
            }
            
            log.info("Found {} players with missing data", playerIdsWithMissingData.size());
            return playerIdsWithMissingData;
            
        } catch (Exception e) {
            log.error("Error finding players with missing data: {}", e.getMessage(), e);
            throw Activity.wrap(e);
        }
    }
    
    @Override
    public boolean enrichPlayerData(Long playerId) {
        log.info("Activity: Enriching player data for ID {}", playerId);
        
        try {
            Optional<Player> playerOpt = playerRepository.findById(playerId);
            if (playerOpt.isEmpty()) {
                log.warn("Player not found: {}", playerId);
                return false;
            }
            
            Player player = playerOpt.get();
            log.info("Enriching player: {} - {}", player.getName(), player.getSport());
            
            // Build AI prompt to get structured data
            String prompt = buildEnrichmentPrompt(player);
            
            // Call AI
            String aiResponse = openRouterClient.chat(prompt);
            
            // Extract JSON from response
            String jsonOnly = extractJsonFromResponse(aiResponse);
            
            // Parse and update player
            JsonNode dataNode = objectMapper.readTree(jsonOnly);
            
            boolean updated = false;
            
            // Update height if missing
            if (player.getHeight() == null && dataNode.has("height") && !dataNode.get("height").isNull()) {
                player.setHeight(dataNode.get("height").asText());
                updated = true;
            }
            
            // Update weight if missing
            if (player.getWeight() == null && dataNode.has("weight") && !dataNode.get("weight").isNull()) {
                player.setWeight(dataNode.get("weight").asText());
                updated = true;
            }
            
            // Update birthdate if missing
            if (player.getBirthdate() == null && dataNode.has("birthdate") && !dataNode.get("birthdate").isNull()) {
                try {
                    String birthdateStr = dataNode.get("birthdate").asText();
                    LocalDate birthdate = LocalDate.parse(birthdateStr, DateTimeFormatter.ISO_DATE);
                    player.setBirthdate(birthdate);
                    updated = true;
                } catch (Exception e) {
                    log.warn("Failed to parse birthdate for {}: {}", player.getName(), e.getMessage());
                }
            }
            
            // Update birthplace if missing
            if (player.getBirthplace() == null && dataNode.has("birthplace") && !dataNode.get("birthplace").isNull()) {
                player.setBirthplace(dataNode.get("birthplace").asText());
                updated = true;
            }
            
            // Update photoUrl if missing
            if (player.getPhotoUrl() == null && dataNode.has("photoUrl") && !dataNode.get("photoUrl").isNull()) {
                player.setPhotoUrl(dataNode.get("photoUrl").asText());
                updated = true;
            }
            
            // Update age if missing or incorrect
            if (dataNode.has("age") && !dataNode.get("age").isNull()) {
                int aiAge = dataNode.get("age").asInt();
                if (player.getAge() == null || player.getAge() == 0) {
                    player.setAge(aiAge);
                    updated = true;
                }
            }
            
            // Update team if missing
            if (player.getTeam() == null && dataNode.has("currentTeam") && !dataNode.get("currentTeam").isNull()) {
                player.setTeam(dataNode.get("currentTeam").asText());
                updated = true;
            }
            
            // Update position if missing
            if (player.getPosition() == null && dataNode.has("position") && !dataNode.get("position").isNull()) {
                player.setPosition(dataNode.get("position").asText());
                updated = true;
            }
            
            if (updated) {
                playerRepository.save(player);
                log.info("Successfully enriched player: {}", player.getName());
                return true;
            } else {
                log.info("No missing data to enrich for player: {}", player.getName());
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error enriching player {}: {}", playerId, e.getMessage(), e);
            
            // Check for rate limits
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                log.warn("OpenRouter rate limit hit, Temporal will retry");
                throw Activity.wrap(new RuntimeException("OpenRouter rate limit (429), retrying..."));
            }
            
            return false;
        }
    }
    
    /**
     * Check if player has missing essential data
     */
    private boolean hasMissingData(Player player) {
        return player.getHeight() == null
            || player.getWeight() == null
            || player.getBirthdate() == null
            || player.getBirthplace() == null
            || player.getPhotoUrl() == null
            || player.getAge() == null
            || player.getAge() == 0;
    }
    
    /**
     * Build AI prompt to get structured player data
     */
    private String buildEnrichmentPrompt(Player player) {
        return String.format("""
            You are a sports data expert. Provide complete and accurate data for this player.
            
            Player Name: %s
            Sport: %s
            Current Team: %s
            Nationality: %s
            
            Return ONLY valid JSON with the following structure (no explanations):
            {
              "height": "6'2\\" (185 cm)" or "185 cm",
              "weight": "80 kg" or "176 lbs",
              "birthdate": "YYYY-MM-DD",
              "birthplace": "City, Country",
              "age": 30,
              "currentTeam": "Team Name",
              "position": "Position",
              "photoUrl": "https://example.com/photo.jpg or null if not available"
            }
            
            CRITICAL REQUIREMENTS:
            - Use REAL, ACCURATE data for this specific player
            - birthdate must be in YYYY-MM-DD format
            - photoUrl should be a valid URL or null
            - All fields are required (use null for truly unavailable data)
            - Return ONLY the JSON object, nothing else
            """, 
            player.getName(), 
            player.getSport(), 
            player.getTeam() != null ? player.getTeam() : "Unknown",
            player.getNationality() != null ? player.getNationality() : "Unknown"
        );
    }
    
    /**
     * Extract JSON from AI response (handles thinking process text)
     */
    private String extractJsonFromResponse(String response) {
        int jsonStart = response.indexOf('{');
        int jsonEnd = response.lastIndexOf('}');
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            return response.substring(jsonStart, jsonEnd + 1);
        }
        
        return response;
    }
}
