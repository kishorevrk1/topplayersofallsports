package com.topplayersofallsports.playerservice.temporal.activity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import com.topplayersofallsports.playerservice.dto.ai.PlayerAnalysisResult;
import com.topplayersofallsports.playerservice.dto.ai.PlayerSearchResult;
import com.topplayersofallsports.playerservice.entity.AIAnalysis;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.AIAnalysisRepository;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.service.AIAnalysisService;
import com.topplayersofallsports.playerservice.service.PlayerDeduplicationService;
import com.topplayersofallsports.playerservice.service.PlayerSearchService;
import io.temporal.activity.Activity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Implementation of Temporal Activities for Player Registration
 * Each method is a discrete, retriable unit of work
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PlayerRegistrationActivitiesImpl implements PlayerRegistrationActivities {
    
    private final PlayerSearchService playerSearchService;
    private final AIAnalysisService aiAnalysisService;
    private final OpenRouterClient openRouterClient;
    private final PlayerRepository playerRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final PlayerDeduplicationService deduplicationService;
    private final ObjectMapper objectMapper;
    
    @Override
    public PlayerSearchResult searchPlayerWithAI(String playerName, String sport, String hints) {
        log.info("Activity: Searching for player '{}' with AI", playerName);
        
        try {
            PlayerSearchResult result = playerSearchService.searchPlayer(playerName, sport, hints);
            
            if (result != null && result.isActivePlayer()) {
                log.info("AI found player: {} - {} ({})", 
                    result.getFullName(), 
                    result.getSport(), 
                    result.getCurrentTeam());
                return result;
            } else {
                log.warn("AI could not validate player: {}", playerName);
                return PlayerSearchResult.builder()
                    .fullName(playerName)
                    .isActivePlayer(false)
                    .careerSummary("Player not found or could not be validated")
                    .build();
            }
            
        } catch (Exception e) {
            log.error("Error in AI search activity: {}", e.getMessage(), e);
            
            // Check if it's a rate limit error (429)
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                log.warn("Rate limit hit during AI search, Temporal will retry with backoff");
                throw Activity.wrap(new RuntimeException("OpenRouter rate limit (429), retrying..."));
            }
            
            throw Activity.wrap(e);
        }
    }
    
    @Override
    public PlayerRegistrationResponse checkExistingPlayer(String playerName) {
        log.info("Activity: Checking if player '{}' already exists", playerName);
        
        try {
            List<Player> existingPlayers = playerRepository.searchByName(playerName);
            
            for (Player player : existingPlayers) {
                // Fuzzy match
                if (isSimilarName(player.getName(), playerName)) {
                    log.info("Player already exists: {} (ID: {})", player.getName(), player.getId());
                    
                    Optional<AIAnalysis> analysisOpt = aiAnalysisRepository.findByPlayer(player);
                    
                    return PlayerRegistrationResponse.builder()
                        .success(true)
                        .status("ALREADY_EXISTS")
                        .message("Player already registered")
                        .playerId(player.getId())
                        .playerName(player.getName())
                        .sport(player.getSport().name())
                        .aiRating(analysisOpt.isPresent() ? analysisOpt.get().getAiRating() : null)
                        .build();
                }
            }
            
            log.info("Player '{}' does not exist, proceeding with registration", playerName);
            return null; // Not found, continue workflow
            
        } catch (Exception e) {
            log.error("Error checking existing player: {}", e.getMessage(), e);
            throw Activity.wrap(e);
        }
    }
    
    @Override
    public String fetchPlayerFromAPI(String sport, String searchQuery, String team) {
        log.info("Activity: API-Sports removed - using AI-only approach");
        // API-Sports has been completely removed - return empty JSON
        return "{}";
    }
    
    @Override
    public String generateAIAnalysis(String playerName, String playerData, String sport) {
        log.info("Activity: Generating complete AI analysis for '{}' (AI-ONLY APPROACH)", playerName);
        
        try {
            // AI-ONLY: Always generate complete player profile
            String prompt = String.format("""
                You are a sports data expert. Generate a comprehensive player profile for:
                
                Player: %s
                Sport: %s
                
                Return ONLY valid JSON (no explanations before or after):
                {
                  "rating": 94,
                  "analysis": "Detailed player analysis based on current form and career achievements",
                  "strengths": ["Primary strength 1", "Primary strength 2", "Key skill 3", "Notable trait 4", "Elite ability 5"],
                  "biography": "Single paragraph biography including full name, birthdate, birthplace, nationality, age, height, current team, position, and brief career summary",
                  "careerHighlights": ["Achievement 1 with year", "Championship/Trophy with year", "Individual award with year", "Record/Milestone", "Recent accomplishment"]
                }
                
                CRITICAL: 
                - biography MUST be a single string paragraph, not an object
                - Use real, accurate facts about the player
                - Rating should reflect current skill level (0-100)
                - Return ONLY the JSON object, nothing else
                """, playerName, sport);
            
            // Call OpenRouter directly
            String aiResponse = openRouterClient.chat(prompt);
            
            // Extract JSON from response (AI might include thinking process)
            String jsonOnly = extractJsonFromResponse(aiResponse);
            
            log.info("AI analysis complete for {}", playerName);
            return jsonOnly;
            
        } catch (Exception e) {
            log.error("Error in AI analysis activity: {}", e.getMessage(), e);
            
            // Check for rate limits
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                log.warn("OpenRouter rate limit hit during analysis, Temporal will retry");
                throw Activity.wrap(new RuntimeException("OpenRouter rate limit (429), retrying..."));
            }
            
            throw Activity.wrap(e);
        }
    }
    
    @Override
    public PlayerRegistrationResponse savePlayerProfile(
            PlayerSearchResult searchResult, 
            String playerData, 
            String aiAnalysis) {
        
        log.info("Activity: Saving player profile for '{}'", searchResult.getFullName());
        
        try {
            // Parse AI analysis
            PlayerAnalysisResult analysis = null;
            if (aiAnalysis != null && !aiAnalysis.isEmpty()) {
                analysis = objectMapper.readValue(aiAnalysis, PlayerAnalysisResult.class);
            }
            
            // Parse player data to get apiPlayerId
            Map<String, Object> playerDataMap = null;
            if (playerData != null && !playerData.isEmpty()) {
                playerDataMap = objectMapper.readValue(playerData, Map.class);
            }
            
            String apiPlayerId = playerDataMap != null && playerDataMap.containsKey("id") 
                ? String.valueOf(playerDataMap.get("id")) 
                : "unknown-" + System.currentTimeMillis();
            
            // Populate deduplication fields
            String fullName = searchResult.getFullName();
            String displayName = extractDisplayName(fullName); // Extract common name
            String normalizedName = deduplicationService.normalizeName(fullName);
            String canonicalId = deduplicationService.generateCanonicalId(
                fullName, 
                searchResult.getNationality(), 
                null // DOB not available yet
            );
            
            // Create Player entity with deduplication fields
            Player player = Player.builder()
                .apiPlayerId(apiPlayerId)
                .name(fullName)
                .displayName(displayName)
                .normalizedName(normalizedName)
                .canonicalId(canonicalId)
                .sport(Sport.valueOf(searchResult.getSport()))
                .position(searchResult.getPosition())
                .team(searchResult.getCurrentTeam())
                .nationality(searchResult.getNationality())
                .age(searchResult.getEstimatedAge())
                .photoUrl(extractPhotoUrl(playerDataMap))
                .build();
            
            log.debug("Player deduplication fields: canonicalId={}, normalizedName={}, displayName={}",
                     canonicalId, normalizedName, displayName);
            
            player = playerRepository.save(player);
            log.info("Player saved with ID: {}", player.getId());
            
            // Save AI Analysis if available
            Integer rating = null;
            if (analysis != null) {
                AIAnalysis aiAnalysisEntity = AIAnalysis.builder()
                    .player(player)
                    .aiRating(analysis.getRating())
                    .analysisText(analysis.getAnalysis())
                    .strengths(analysis.getStrengths())
                    .biography(analysis.getBiography())
                    .careerHighlights(analysis.getCareerHighlights())
                    .generatedAt(LocalDateTime.now())
                    .llmModel("deepseek/deepseek-r1:free")
                    .build();
                
                aiAnalysisRepository.save(aiAnalysisEntity);
                rating = analysis.getRating();
                log.info("AI analysis saved for player ID: {}", player.getId());
            }
            
            return PlayerRegistrationResponse.builder()
                .success(true)
                .status("NEW")
                .message("Player successfully registered with AI analysis")
                .playerId(player.getId())
                .playerName(player.getName())
                .sport(player.getSport().name())
                .aiRating(rating)
                .build();
            
        } catch (Exception e) {
            log.error("Error saving player profile: {}", e.getMessage(), e);
            throw Activity.wrap(e);
        }
    }
    
    // Helper methods
    
    private boolean isSimilarName(String name1, String name2) {
        String normalized1 = name1.toLowerCase().replaceAll("[^a-z]", "");
        String normalized2 = name2.toLowerCase().replaceAll("[^a-z]", "");
        
        return normalized1.equals(normalized2) || 
               normalized1.contains(normalized2) || 
               normalized2.contains(normalized1);
    }
    
    private String extractPhotoUrl(Map<String, Object> playerDataMap) {
        try {
            if (playerDataMap != null && playerDataMap.containsKey("photo")) {
                return (String) playerDataMap.get("photo");
            }
        } catch (Exception e) {
            log.debug("Could not extract photo URL from player data");
        }
        return null;
    }
    
    /**
     * Extract display name (common/nickname) from full name
     * Examples: "Vinícius José..." -> "Vinicius Junior", "Kylian Sanmi Mbappé..." -> "Kylian Mbappé"
     */
    private String extractDisplayName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return fullName;
        }
        
        // For names with multiple parts, take first and last name
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length >= 2) {
            // Return "FirstName LastName" format
            return parts[0] + " " + parts[parts.length - 1];
        }
        
        return fullName;
    }
    
    /**
     * Extract JSON from AI response that may contain thinking/explanation text
     * DeepSeek R1 often includes reasoning before the JSON
     */
    private String extractJsonFromResponse(String aiResponse) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return "{}";
        }
        
        // Find first { and last }
        int firstBrace = aiResponse.indexOf('{');
        int lastBrace = aiResponse.lastIndexOf('}');
        
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            String extracted = aiResponse.substring(firstBrace, lastBrace + 1);
            log.debug("Extracted JSON from AI response (length: {} -> {})", aiResponse.length(), extracted.length());
            return extracted;
        }
        
        // If no JSON found, try to find it in code blocks
        if (aiResponse.contains("```json")) {
            int start = aiResponse.indexOf("```json") + 7;
            int end = aiResponse.indexOf("```", start);
            if (end > start) {
                return aiResponse.substring(start, end).trim();
            }
        }
        
        log.warn("Could not extract JSON from AI response, returning as-is");
        return aiResponse.trim();
    }
}
