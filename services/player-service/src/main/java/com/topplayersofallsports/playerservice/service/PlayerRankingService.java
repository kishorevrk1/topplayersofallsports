package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service for managing top 50 players per sport with AI-powered ranking updates
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerRankingService {
    
    private final PlayerRepository playerRepository;
    private final OpenRouterClient openRouterClient;
    private final PlayerSearchService playerSearchService;
    private final PlayerDeduplicationService deduplicationService;
    private final ObjectMapper objectMapper;
    
    private static final int TOP_PLAYERS_LIMIT = 50;
    private static final double MIN_RANKING_SCORE = 70.0; // Minimum score to qualify for top 50
    
    /**
     * Initialize top 50 players for a sport using AI
     */
    @Transactional
    public List<Player> initializeTop50(Sport sport) {
        log.info("Initializing top 50 players for {}", sport);
        
        // Check if already initialized
        long existingCount = playerRepository.countBySportAndCurrentRankIsNotNull(sport);
        if (existingCount >= TOP_PLAYERS_LIMIT) {
            log.info("{} already has {} ranked players", sport, existingCount);
            return playerRepository.findBySportAndCurrentRankIsNotNullOrderByCurrentRankAsc(sport);
        }
        
        // Get top 50 players from AI
        String prompt = String.format("""
            List the current top 50 %s players in the world.
            
            For each player provide:
            - Full name
            - Current team/club
            - Nationality
            - Age (approximate)
            - Position
            - Brief reason why they're top 50 (2-3 sentences)
            
            Return as JSON array:
            [
              {
                "name": "Full Name",
                "team": "Team Name",
                "nationality": "Country",
                "age": 25,
                "position": "Position",
                "reasoning": "Why they're elite..."
              },
              ...
            ]
            
            IMPORTANT: Return ONLY valid JSON array, no explanations.
            Focus on currently active players who are performing at the highest level.
            """, sport.name().toLowerCase());
        
        try {
            String aiResponse = openRouterClient.chat(prompt, 0.3);
            String jsonContent = extractJsonArray(aiResponse);
            
            JsonNode playersArray = objectMapper.readTree(jsonContent);
            List<Player> registeredPlayers = new ArrayList<>();
            
            int rank = 1;
            for (JsonNode playerNode : playersArray) {
                if (rank > TOP_PLAYERS_LIMIT) break;
                
                try {
                    Player player = createPlayerFromAIData(playerNode, sport, rank);
                    if (player != null) {
                        Player saved = playerRepository.save(player);
                        registeredPlayers.add(saved);
                        log.info("Registered #{} - {}", rank, saved.getName());
                        rank++;
                    }
                } catch (Exception e) {
                    log.error("Failed to register player from AI data: {}", e.getMessage());
                }
            }
            
            log.info("Successfully initialized {} with {} players", sport, registeredPlayers.size());
            return registeredPlayers;
            
        } catch (Exception e) {
            log.error("Failed to initialize top 50 for {}: {}", sport, e.getMessage(), e);
            throw new RuntimeException("Failed to initialize top 50: " + e.getMessage());
        }
    }
    
    /**
     * Evaluate if a player qualifies for top 50
     */
    public boolean evaluatePlayerForTop50(String playerName, Sport sport) {
        log.info("Evaluating if {} qualifies for {} top 50", playerName, sport);
        
        String prompt = String.format("""
            Evaluate if this player currently qualifies as a top 50 %s player in the world:
            
            Player Name: "%s"
            
            Consider:
            1. Current performance and form
            2. Recent achievements and statistics
            3. Team success and individual contributions
            4. Consistency and longevity
            5. Comparison with other top players
            
            Return JSON:
            {
              "qualifies": true/false,
              "rankingScore": 0-100,
              "currentRank": estimated position (1-50) or null,
              "reasoning": "Detailed explanation",
              "performanceSummary": "Recent stats and achievements"
            }
            
            Return ONLY valid JSON, no explanations.
            """, sport.name().toLowerCase(), playerName);
        
        try {
            String aiResponse = openRouterClient.chat(prompt, 0.3, "openai/gpt-4o-mini");
            String jsonContent = extractJsonObject(aiResponse);
            JsonNode result = objectMapper.readTree(jsonContent);
            
            boolean qualifies = result.get("qualifies").asBoolean();
            double score = result.get("rankingScore").asDouble();
            
            log.info("{} evaluation: qualifies={}, score={}", playerName, qualifies, score);
            return qualifies && score >= MIN_RANKING_SCORE;
            
        } catch (Exception e) {
            log.error("Failed to evaluate player: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Update rankings for a sport (monthly workflow)
     */
    @Transactional
    public void updateRankingsForSport(Sport sport) {
        log.info("Starting monthly ranking update for {}", sport);
        
        List<Player> currentTop50 = playerRepository.findBySportAndCurrentRankIsNotNullOrderByCurrentRankAsc(sport);
        
        String prompt = String.format("""
            Re-evaluate the current top 50 %s players considering:
            - Recent performance (last month)
            - Major tournaments/matches
            - Form and consistency
            - Injuries or retirements
            
            Current top 50:
            %s
            
            Return JSON with updates:
            {
              "updatedRankings": [
                {"name": "Player Name", "newRank": 1-50, "score": 0-100, "reasoning": "..."},
                ...
              ],
              "playersToRemove": ["Player Name who dropped out", ...],
              "playersToAdd": [
                {"name": "New Player", "rank": position, "score": 85, "reasoning": "..."},
                ...
              ]
            }
            
            Return ONLY valid JSON.
            """, sport.name().toLowerCase(), formatCurrentTop50(currentTop50));
        
        try {
            String aiResponse = openRouterClient.chat(prompt, 0.5);
            String jsonContent = extractJsonObject(aiResponse);
            JsonNode updates = objectMapper.readTree(jsonContent);
            
            // Apply ranking updates
            applyRankingUpdates(sport, updates);
            
            log.info("Successfully updated rankings for {}", sport);
            
        } catch (Exception e) {
            log.error("Failed to update rankings for {}: {}", sport, e.getMessage(), e);
        }
    }
    
    /**
     * Get current top 50 for a sport
     */
    public List<Player> getTop50(Sport sport) {
        return playerRepository.findBySportAndCurrentRankIsNotNullOrderByCurrentRankAsc(sport);
    }
    
    /**
     * Check if player is in top 50
     */
    public boolean isInTop50(String playerName, Sport sport) {
        return playerRepository.existsByNameIgnoreCaseAndSportAndCurrentRankIsNotNull(playerName, sport);
    }
    
    // Helper methods
    
    private Player createPlayerFromAIData(JsonNode playerData, Sport sport, int rank) {
        String name = playerData.get("name").asText();
        String team = playerData.has("team") ? playerData.get("team").asText() : null;
        String nationality = playerData.has("nationality") ? playerData.get("nationality").asText() : null;
        Integer age = playerData.has("age") ? playerData.get("age").asInt() : null;
        String position = playerData.has("position") ? playerData.get("position").asText() : null;
        String reasoning = playerData.has("reasoning") ? playerData.get("reasoning").asText() : null;
        
        // Generate canonical ID and normalized name
        String normalizedName = deduplicationService.normalizeName(name);
        String canonicalId = deduplicationService.generateCanonicalId(name, nationality, null);
        
        // Extract display name (simple version - first + last)
        String displayName = extractDisplayName(name);
        
        return Player.builder()
                .apiPlayerId("ai-" + System.currentTimeMillis() + "-" + rank)
                .name(name)
                .displayName(displayName)
                .normalizedName(normalizedName)
                .canonicalId(canonicalId)
                .sport(sport)
                .team(team)
                .position(position)
                .nationality(nationality)
                .age(age)
                .currentRank(rank)
                .previousRank(rank)
                .rankingScore(calculateInitialScore(rank))
                .lastRankingUpdate(LocalDateTime.now())
                .isActive(true)
                .performanceSummary(reasoning)
                .build();
    }
    
    private String extractDisplayName(String fullName) {
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length >= 2) {
            return parts[0] + " " + parts[parts.length - 1];
        }
        return fullName;
    }
    
    private double calculateInitialScore(int rank) {
        // Linear score: rank 1 = 100, rank 50 = 70
        return 100.0 - ((rank - 1) * 0.6);
    }
    
    private String extractJsonArray(String aiResponse) {
        int firstBracket = aiResponse.indexOf('[');
        int lastBracket = aiResponse.lastIndexOf(']');
        if (firstBracket != -1 && lastBracket != -1) {
            return aiResponse.substring(firstBracket, lastBracket + 1);
        }
        return aiResponse;
    }
    
    private String extractJsonObject(String aiResponse) {
        int firstBrace = aiResponse.indexOf('{');
        int lastBrace = aiResponse.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1) {
            return aiResponse.substring(firstBrace, lastBrace + 1);
        }
        return aiResponse;
    }
    
    private String formatCurrentTop50(List<Player> players) {
        StringBuilder sb = new StringBuilder();
        for (Player p : players) {
            sb.append(String.format("#%d - %s (%s)\n", p.getCurrentRank(), p.getName(), p.getTeam()));
        }
        return sb.toString();
    }
    
    private void applyRankingUpdates(Sport sport, JsonNode updates) {
        // TODO: Implement detailed ranking updates
        log.info("Applying ranking updates for {}", sport);
        // This will be implemented in the workflow
    }
}
