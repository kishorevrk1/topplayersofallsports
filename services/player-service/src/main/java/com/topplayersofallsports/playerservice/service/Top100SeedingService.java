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
 * Uses Claude (Anthropic API directly) to generate comprehensive player data.
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
    private final PlayerImageEnrichmentService imageEnrichmentService;

    // Process in batches to handle rate limits and token limits
    private static final int BATCH_SIZE = 10;
    private static final int BATCH_DELAY_SECONDS = 10; // Anthropic direct — generous rate limits, no proxy throttling
    
    /**
     * Seed Top 100 players for a specific sport.
     * Generates player data using AI and stores in database.
     * NOT @Transactional — each savePlayer runs in its own Spring Data transaction,
     * so one duplicate/failure does not poison the Hibernate session for the whole run.
     */
    public int seedTop100ForSport(Sport sport) {
        log.info("🚀 Starting Top 100 seeding for sport: {}", sport);

        int totalSeeded = 0;
        // Track all normalized names saved so far to deduplicate across batches
        List<String> alreadySavedNames = new ArrayList<>();

        // Seed any existing players into the dedup list
        playerRepository.findBySport(sport)
                .forEach(p -> alreadySavedNames.add(normalizeName(p.getName())));

        // Process in batches of 10 to avoid token limits and rate limits
        for (int batch = 0; batch < 10; batch++) {
            int startRank = batch * BATCH_SIZE + 1;
            int endRank = startRank + BATCH_SIZE - 1;

            log.info("📋 Processing batch {} (ranks {}-{}) for {}", batch + 1, startRank, endRank, sport);

            try {
                List<Top100PlayerInfo> players = generatePlayersBatch(sport, startRank, endRank, alreadySavedNames);

                for (Top100PlayerInfo playerInfo : players) {
                    try {
                        // In-memory fuzzy duplicate check BEFORE expensive DB+photo ops
                        String newNorm = normalizeName(playerInfo.getName());
                        if (isFuzzyDuplicate(newNorm, alreadySavedNames)) {
                            log.info("⚠️ Skipping fuzzy duplicate '{}' (similar name already saved)", playerInfo.getName());
                            continue;
                        }

                        // Resolve photo BEFORE the DB transaction — Wikipedia call outside @Transactional
                        String displayName = playerInfo.getDisplayName() != null
                                ? playerInfo.getDisplayName() : playerInfo.getName();
                        String photoUrl = imageEnrichmentService.findPhotoUrl(
                                displayName, playerInfo.getName(), sport.name().toLowerCase());

                        savePlayer(playerInfo, sport, photoUrl);
                        alreadySavedNames.add(newNorm);
                        totalSeeded++;
                        log.info("✅ Saved player #{}: {} ({}){}",
                                playerInfo.getRank(), playerInfo.getName(), sport,
                                photoUrl != null ? " [photo ✓]" : " [no photo]");
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
     * Fuzzy duplicate detection: returns true if newNorm is a substring of any saved name
     * or any saved name is a substring of newNorm AND they share the same last name token.
     * This catches "zinedine zidane" vs "zinedine yazid zidane".
     */
    private boolean isFuzzyDuplicate(String newNorm, List<String> savedNames) {
        String[] newTokens = newNorm.split("\\s+");
        String newLastToken = newTokens[newTokens.length - 1];
        for (String saved : savedNames) {
            String[] savedTokens = saved.split("\\s+");
            String savedLastToken = savedTokens[savedTokens.length - 1];
            // Same last name AND at least one other token in common → duplicate
            if (newLastToken.equals(savedLastToken) && newTokens.length > 1) {
                for (String nt : newTokens) {
                    for (String st : savedTokens) {
                        if (!nt.equals(newLastToken) && nt.equals(st)) {
                            return true; // Shared non-last-name token + same last name
                        }
                    }
                }
            }
            // One is a subsequence of the other → duplicate
            if (saved.contains(newNorm) || newNorm.contains(saved)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate a batch of players using AI, passing already-saved names to avoid repeats.
     */
    private List<Top100PlayerInfo> generatePlayersBatch(Sport sport, int startRank, int endRank,
                                                         List<String> alreadySavedNames) {
        String sportName = getSportDisplayName(sport);
        String prompt = buildBatchPrompt(sportName, startRank, endRank, alreadySavedNames);
        log.debug("Sending AI request for {} ranks {}-{}", sport, startRank, endRank);
        String response = openRouterClient.chat(prompt, 0.7);
        return parsePlayersResponse(response, sport);
    }
    
    /**
     * Build the AI prompt for generating a batch of players, excluding already-generated ones.
     */
    private String buildBatchPrompt(String sportName, int startRank, int endRank,
                                     List<String> alreadySavedNames) {
        String exclusionBlock = alreadySavedNames.isEmpty() ? "" :
            "\nDO NOT include any of these already-listed players (they appear in earlier ranks):\n" +
            String.join(", ", alreadySavedNames) + "\n";

        int count = endRank - startRank + 1;
        return "You are a world-class sports historian and analyst. Generate the ALL-TIME GREATEST " + sportName +
            " players ranked #" + startRank + " to #" + endRank + ".\n" +
            exclusionBlock +
            "\nThis is for \"Top 100 All-Time Greatest Players\" up to and including 2025.\n" +
            "Consider their entire career achievements, impact, longevity, championships, individual awards, and legacy.\n" +
            "\nFor each player, provide a JSON object with these EXACT fields:\n" +
            "- rank: integer (" + startRank + "-" + endRank + ")\n" +
            "- name: string (common name fans know them by, e.g. \"Lionel Messi\" not \"Lionel Andres Messi\")\n" +
            "- displayName: string (same as name — the fan-known name)\n" +
            "- nationality: string (country)\n" +
            "- position: string (playing position)\n" +
            "- team: string (most iconic team they played for)\n" +
            "- birthYear: integer (year of birth)\n" +
            "- height: string (e.g., \"6'2\\\"\" or \"188 cm\")\n" +
            "- weight: string (e.g., \"185 lbs\" or \"84 kg\")\n" +
            "- isActive: boolean (still actively playing as of 2025?)\n" +
            "- rating: integer (0-100, your assessment of their all-time greatness)\n" +
            "- biography: string (2-3 sentence career summary)\n" +
            "- careerHighlights: array of strings (3-5 major achievements)\n" +
            "- strengths: array of strings (3 key skills/attributes)\n" +
            "- legacySummary: string (one impactful sentence about their legacy)\n" +
            "\nIMPORTANT:\n" +
            "- Return ONLY a valid JSON array of player objects\n" +
            "- No markdown, no explanation text, just pure JSON\n" +
            "- Include exactly " + count + " players ranked from " + startRank + " to " + endRank + "\n" +
            "- Use common fan-known names (NOT full official birth names)\n" +
            "- Make sure the data is factually accurate for real players\n" +
            "\nJSON response:";
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
     * Save player and AI analysis to database.
     * Checks canonical_id first to skip cross-batch duplicates (AI sometimes
     * repeats the same player at a different rank in a subsequent batch).
     */
    @Transactional
    public void savePlayer(Top100PlayerInfo info, Sport sport, String resolvedPhotoUrl) {
        // Generate unique API ID for this player
        String apiPlayerId = sport.name() + "_TOP100_" + info.getRank();
        String canonicalId = generateCanonicalId(info.getName(), sport);

        // Check canonical_id first — catches same player returned at a different rank
        Player existingByCanonical = playerRepository.findByCanonicalId(canonicalId).orElse(null);
        if (existingByCanonical != null) {
            log.debug("Skipping duplicate player '{}' (canonical_id '{}' already exists at rank {})",
                info.getName(), canonicalId, existingByCanonical.getCurrentRank());
            return;
        }

        // Check if player already exists by rank-based API ID
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
        player.setEloScore(info.getRank() != null ? 1800.0 - ((info.getRank() - 1) * 6.06) : 1500.0);
        player.setLastRankingUpdate(LocalDateTime.now());
        
        // Set birth date if birth year is provided
        if (info.getBirthYear() != null) {
            player.setBirthdate(LocalDate.of(info.getBirthYear(), 1, 1));
            player.setAge(2025 - info.getBirthYear());
        }
        
        // Use resolved Wikipedia photo, or fall back to avatar placeholder
        player.setPhotoUrl(resolvedPhotoUrl != null ? resolvedPhotoUrl : generateFallbackPhotoUrl(info));
        
        // Set canonical ID (already computed at top for duplicate check)
        player.setCanonicalId(canonicalId);
        
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
        analysis.setLlmModel("openrouter-top100-seeding");
        
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
     * Fallback avatar URL when Wikipedia has no photo for a player.
     */
    private String generateFallbackPhotoUrl(Top100PlayerInfo info) {
        String name = info.getDisplayName() != null ? info.getDisplayName() : info.getName();
        return "https://ui-avatars.com/api/?name=" + name.replace(" ", "+") + "&size=256&background=random";
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
