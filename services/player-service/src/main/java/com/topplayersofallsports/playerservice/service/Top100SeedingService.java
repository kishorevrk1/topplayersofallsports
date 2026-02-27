package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.dto.ai.Top100PlayerInfo;
import com.topplayersofallsports.playerservice.entity.AIAnalysis;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.AIAnalysisRepository;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Service to seed the database with Top 100 All-Time Greatest Players for each sport.
 * Uses AI (DeepSeek R1 via OpenRouter) to generate comprehensive player data.
 * 
 * Since it's 2026, we get the Top 100 players up to and including 2025.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class Top100SeedingService {
    
    private final OpenRouterClient openRouterClient;
    private final PlayerRepository playerRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final ObjectMapper objectMapper;
    
    // Process in batches to handle rate limits and token limits
    private static final int BATCH_SIZE = 10;
    private static final int BATCH_DELAY_SECONDS = 5;
    
    /**
     * Seed Top 100 players for a specific sport.
     * Generates player data using AI and stores in database.
     */
    @Transactional
    public int seedTop100ForSport(Sport sport) {
        log.info("🚀 Starting Top 100 seeding for sport: {}", sport);
        
        int totalSeeded = 0;
        
        // Process in batches of 10 to avoid token limits and rate limits
        for (int batch = 0; batch < 10; batch++) {
            int startRank = batch * BATCH_SIZE + 1;
            int endRank = startRank + BATCH_SIZE - 1;
            
            log.info("📋 Processing batch {} (ranks {}-{}) for {}", batch + 1, startRank, endRank, sport);
            
            try {
                List<Top100PlayerInfo> players = generatePlayersBatch(sport, startRank, endRank);
                
                for (Top100PlayerInfo playerInfo : players) {
                    try {
                        savePlayer(playerInfo, sport);
                        totalSeeded++;
                        log.info("✅ Saved player #{}: {} ({})", playerInfo.getRank(), playerInfo.getName(), sport);
                    } catch (Exception e) {
                        log.error("❌ Failed to save player {}: {}", playerInfo.getName(), e.getMessage());
                    }
                }
                
                // Wait between batches to respect rate limits
                if (batch < 9) {
                    log.info("⏳ Waiting {}s before next batch...", BATCH_DELAY_SECONDS);
                    TimeUnit.SECONDS.sleep(BATCH_DELAY_SECONDS);
                }
                
            } catch (Exception e) {
                log.error("❌ Failed to process batch {} for {}: {}", batch + 1, sport, e.getMessage());
            }
        }
        
        log.info("🎉 Completed seeding for {}. Total players: {}", sport, totalSeeded);
        return totalSeeded;
    }
    
    /**
     * Generate a batch of players using AI
     */
    private List<Top100PlayerInfo> generatePlayersBatch(Sport sport, int startRank, int endRank) {
        String sportName = getSportDisplayName(sport);
        
        String prompt = buildBatchPrompt(sportName, startRank, endRank);
        
        log.debug("Sending AI request for {} ranks {}-{}", sport, startRank, endRank);
        
        String response = openRouterClient.chat(prompt, 0.7);
        
        return parsePlayersResponse(response, sport);
    }
    
    /**
     * Build the AI prompt for generating a batch of players
     */
    private String buildBatchPrompt(String sportName, int startRank, int endRank) {
        return String.format("""
            You are a world-class sports historian and analyst. Generate the ALL-TIME GREATEST %s players ranked #%d to #%d.
            
            This is for "Top 100 All-Time Greatest Players" up to and including 2025.
            Consider their entire career achievements, impact, longevity, championships, individual awards, and legacy.
            
            For each player, provide a JSON object with these EXACT fields:
            - rank: integer (%d-%d)
            - name: string (full official name)
            - displayName: string (common name/nickname fans know them by)
            - nationality: string (country)
            - position: string (playing position)
            - team: string (most iconic team they played for)
            - birthYear: integer (year of birth)
            - height: string (e.g., "6'2\"" or "188 cm")
            - weight: string (e.g., "185 lbs" or "84 kg")
            - isActive: boolean (still actively playing as of 2025?)
            - rating: integer (0-100, your assessment of their all-time greatness)
            - biography: string (2-3 sentence career summary)
            - careerHighlights: array of strings (3-5 major achievements)
            - strengths: array of strings (3 key skills/attributes)
            - legacySummary: string (one impactful sentence about their legacy)
            
            IMPORTANT: 
            - Return ONLY a valid JSON array of player objects
            - No markdown, no explanation text, just pure JSON
            - Include exactly %d players ranked from %d to %d
            - Make sure the data is factually accurate for real players
            
            JSON response:
            """, sportName, startRank, endRank, startRank, endRank, endRank - startRank + 1, startRank, endRank);
    }
    
    /**
     * Parse AI response to list of player info
     */
    private List<Top100PlayerInfo> parsePlayersResponse(String response, Sport sport) {
        try {
            // Clean up response - remove markdown code blocks if present
            String cleaned = response.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();
            
            // Find JSON array in response
            int arrayStart = cleaned.indexOf('[');
            int arrayEnd = cleaned.lastIndexOf(']');
            if (arrayStart >= 0 && arrayEnd > arrayStart) {
                cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
            }
            
            List<Top100PlayerInfo> players = objectMapper.readValue(
                cleaned, 
                new TypeReference<List<Top100PlayerInfo>>() {}
            );
            
            log.info("Parsed {} players from AI response for {}", players.size(), sport);
            return players;
            
        } catch (Exception e) {
            log.error("Failed to parse AI response for {}: {}", sport, e.getMessage());
            log.debug("Raw response: {}", response);
            return new ArrayList<>();
        }
    }
    
    /**
     * Save player and AI analysis to database
     */
    @Transactional
    public void savePlayer(Top100PlayerInfo info, Sport sport) {
        // Generate unique API ID for this player
        String apiPlayerId = sport.name() + "_TOP100_" + info.getRank();
        
        // Check if player already exists
        Player existingPlayer = playerRepository.findByApiPlayerId(apiPlayerId).orElse(null);
        
        Player player;
        if (existingPlayer != null) {
            player = existingPlayer;
            log.debug("Updating existing player: {}", info.getName());
        } else {
            player = Player.builder()
                .apiPlayerId(apiPlayerId)
                .sport(sport)
                .build();
        }
        
        // Update player info
        player.setName(info.getName());
        player.setDisplayName(info.getDisplayName() != null ? info.getDisplayName() : info.getName());
        player.setNormalizedName(normalizeName(info.getName()));
        player.setNationality(info.getNationality());
        player.setPosition(info.getPosition());
        player.setTeam(info.getTeam());
        player.setHeight(info.getHeight());
        player.setWeight(info.getWeight());
        player.setIsActive(info.getIsActive() != null ? info.getIsActive() : false);
        player.setCurrentRank(info.getRank());
        player.setPreviousRank(info.getRank());
        player.setRankingScore(info.getRating() != null ? info.getRating().doubleValue() : 0.0);
        player.setLastRankingUpdate(LocalDateTime.now());
        
        // Set birth date if birth year is provided
        if (info.getBirthYear() != null) {
            player.setBirthdate(LocalDate.of(info.getBirthYear(), 1, 1));
            player.setAge(2025 - info.getBirthYear());
        }
        
        // Generate photo URL placeholder (can be replaced with actual image search later)
        player.setPhotoUrl(generatePhotoUrl(info));
        
        // Generate canonical ID for deduplication
        player.setCanonicalId(generateCanonicalId(info.getName(), sport));
        
        player = playerRepository.save(player);
        
        // Save or update AI analysis
        AIAnalysis existingAnalysis = aiAnalysisRepository.findByPlayer(player).orElse(null);
        
        AIAnalysis analysis;
        if (existingAnalysis != null) {
            analysis = existingAnalysis;
        } else {
            analysis = AIAnalysis.builder()
                .player(player)
                .build();
        }
        
        analysis.setAiRating(info.getRating() != null ? info.getRating() : 0);
        analysis.setAnalysisText(info.getBiography());
        analysis.setStrengths(info.getStrengths());
        analysis.setBiography(info.getBiography());
        analysis.setCareerHighlights(info.getCareerHighlights());
        analysis.setGeneratedAt(LocalDateTime.now());
        analysis.setLlmModel("deepseek-r1-top100-seeding");
        
        aiAnalysisRepository.save(analysis);
    }
    
    /**
     * Normalize player name for fuzzy matching
     */
    private String normalizeName(String name) {
        if (name == null) return "";
        return name.toLowerCase()
            .replaceAll("[áàâãä]", "a")
            .replaceAll("[éèêë]", "e")
            .replaceAll("[íìîï]", "i")
            .replaceAll("[óòôõö]", "o")
            .replaceAll("[úùûü]", "u")
            .replaceAll("[ñ]", "n")
            .replaceAll("[ç]", "c")
            .replaceAll("[^a-z0-9\\s]", "")
            .trim();
    }
    
    /**
     * Generate canonical ID for deduplication
     */
    private String generateCanonicalId(String name, Sport sport) {
        String normalized = normalizeName(name);
        return sport.name() + "_" + normalized.replaceAll("\\s+", "_");
    }
    
    /**
     * Generate a placeholder photo URL (using a placeholder service)
     */
    private String generatePhotoUrl(Top100PlayerInfo info) {
        // Use a placeholder for now - can integrate actual photo search later
        String searchTerm = info.getPhotoSearchTerm() != null 
            ? info.getPhotoSearchTerm() 
            : info.getName();
        return "https://ui-avatars.com/api/?name=" + 
            searchTerm.replace(" ", "+") + 
            "&size=256&background=random";
    }
    
    /**
     * Get display name for sport
     */
    private String getSportDisplayName(Sport sport) {
        return switch (sport) {
            case FOOTBALL -> "Football/Soccer";
            case BASKETBALL -> "Basketball (NBA)";
            case MMA -> "MMA/UFC";
            case CRICKET -> "Cricket";
            case TENNIS -> "Tennis";
            case BASEBALL -> "Baseball (MLB)";
            case HOCKEY -> "Hockey (NHL)";
            case GOLF -> "Golf";
            case F1 -> "Formula 1 Racing";
            case BOXING -> "Boxing";
            case SWIMMING -> "Swimming";
            case ATHLETICS -> "Athletics/Track & Field";
        };
    }
    
    /**
     * Check if a sport has already been seeded
     */
    public boolean isSportSeeded(Sport sport) {
        long count = playerRepository.countBySportAndCurrentRankIsNotNull(sport);
        return count >= 50; // Consider seeded if at least 50 players exist
    }
    
    /**
     * Get seeding stats for all sports
     */
    public String getSeedingStats() {
        StringBuilder stats = new StringBuilder();
        stats.append("Top 100 Seeding Stats:\n");
        stats.append("======================\n");
        
        for (Sport sport : Sport.values()) {
            long total = playerRepository.countBySport(sport);
            long ranked = playerRepository.countBySportAndCurrentRankIsNotNull(sport);
            stats.append(String.format("%s: %d total, %d ranked\n", sport.name(), total, ranked));
        }
        
        return stats.toString();
    }
    
    /**
     * Clear all players for a sport (for re-seeding)
     */
    @Transactional
    public void clearSportData(Sport sport) {
        log.warn("⚠️ Clearing all data for sport: {}", sport);
        
        List<Player> players = playerRepository.findBySport(sport);
        for (Player player : players) {
            aiAnalysisRepository.findByPlayer(player).ifPresent(aiAnalysisRepository::delete);
        }
        playerRepository.deleteAll(players);
        
        log.info("Deleted {} players for {}", players.size(), sport);
    }
}
