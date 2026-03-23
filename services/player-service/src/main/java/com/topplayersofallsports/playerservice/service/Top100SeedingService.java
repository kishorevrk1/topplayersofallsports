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
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

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

        // Determine which ranks already exist so we can skip full batches
        Set<Integer> existingRanks = playerRepository.findBySport(sport).stream()
                .filter(p -> p.getCurrentRank() != null)
                .map(Player::getCurrentRank)
                .collect(Collectors.toSet());

        // Process in batches of 10 to avoid token limits and rate limits
        for (int batch = 0; batch < 10; batch++) {
            int startRank = batch * BATCH_SIZE + 1;
            int endRank = startRank + BATCH_SIZE - 1;

            // Skip batch if all ranks in this range already exist
            boolean allFilled = IntStream.rangeClosed(startRank, endRank)
                    .allMatch(existingRanks::contains);
            if (allFilled) {
                log.info("⏭️ Skipping batch {} (ranks {}-{}) — all filled", batch + 1, startRank, endRank);
                continue;
            }

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

        // Gap-fill: find missing ranks and fill them with targeted requests
        totalSeeded += fillMissingRanks(sport, alreadySavedNames);

        log.info("🎉 Completed seeding for {}. Total players: {}", sport, totalSeeded);
        return totalSeeded;
    }

    /**
     * Fill missing rank slots by detecting gaps and requesting specific replacements.
     * Uses a targeted prompt asking AI for unique players to fill exact rank numbers.
     */
    private int fillMissingRanks(Sport sport, List<String> alreadySavedNames) {
        Set<Integer> existingRanks = playerRepository.findBySport(sport).stream()
                .filter(p -> p.getCurrentRank() != null)
                .map(Player::getCurrentRank)
                .collect(Collectors.toSet());

        List<Integer> missingRanks = IntStream.rangeClosed(1, 100)
                .filter(r -> !existingRanks.contains(r))
                .boxed()
                .collect(Collectors.toList());

        if (missingRanks.isEmpty()) {
            log.info("✅ No missing ranks for {} — all 100 filled!", sport);
            return 0;
        }

        log.info("🔧 Gap-filling {} missing ranks for {}: {}", missingRanks.size(), sport, missingRanks);
        int filled = 0;

        // Process missing ranks in small batches
        for (int i = 0; i < missingRanks.size(); i += BATCH_SIZE) {
            List<Integer> batch = missingRanks.subList(i, Math.min(i + BATCH_SIZE, missingRanks.size()));
            try {
                String prompt = buildGapFillPrompt(getSportDisplayName(sport), batch, alreadySavedNames);
                String response = openRouterClient.chat(prompt, 0.7);
                List<Top100PlayerInfo> players = parsePlayersResponse(response, sport);

                for (Top100PlayerInfo playerInfo : players) {
                    try {
                        String newNorm = normalizeName(playerInfo.getName());
                        if (isFuzzyDuplicate(newNorm, alreadySavedNames)) {
                            log.info("⚠️ Gap-fill: skipping duplicate '{}'", playerInfo.getName());
                            continue;
                        }

                        // Ensure rank is one of the missing ones
                        if (!batch.contains(playerInfo.getRank())) {
                            // Reassign to first available missing rank in this batch
                            Integer availableRank = batch.stream()
                                    .filter(r -> !existingRanks.contains(r))
                                    .findFirst().orElse(null);
                            if (availableRank == null) continue;
                            playerInfo.setRank(availableRank);
                        }

                        String displayName = playerInfo.getDisplayName() != null
                                ? playerInfo.getDisplayName() : playerInfo.getName();
                        String photoUrl = imageEnrichmentService.findPhotoUrl(
                                displayName, playerInfo.getName(), sport.name().toLowerCase());

                        savePlayer(playerInfo, sport, photoUrl);
                        alreadySavedNames.add(newNorm);
                        existingRanks.add(playerInfo.getRank());
                        filled++;
                        log.info("✅ Gap-filled rank #{}: {} ({})", playerInfo.getRank(), playerInfo.getName(), sport);
                    } catch (Exception e) {
                        log.error("❌ Gap-fill failed for {}: {}", playerInfo.getName(), e.getMessage());
                    }
                }

                if (i + BATCH_SIZE < missingRanks.size()) {
                    TimeUnit.SECONDS.sleep(BATCH_DELAY_SECONDS);
                }
            } catch (Exception e) {
                log.error("❌ Gap-fill batch failed for {}: {}", sport, e.getMessage());
            }
        }

        log.info("🔧 Gap-filling complete for {}. Filled {} of {} missing ranks", sport, filled, missingRanks.size());
        return filled;
    }

    /**
     * Build a targeted prompt for filling specific missing rank slots.
     */
    private String buildGapFillPrompt(String sportName, List<Integer> missingRanks, List<String> alreadySavedNames) {
        String ranksStr = missingRanks.stream().map(String::valueOf).collect(Collectors.joining(", "));

        return "You are a world-class sports historian. I need you to fill SPECIFIC missing rank slots " +
                "in our Top 100 All-Time Greatest " + sportName + " Players list (up to 2025).\n\n" +
                "MISSING RANKS TO FILL: " + ranksStr + "\n\n" +
                "DO NOT include any of these already-listed players:\n" +
                String.join(", ", alreadySavedNames) + "\n\n" +
                "You MUST provide DIFFERENT players than those listed above. Think of legendary " + sportName +
                " players who deserve a Top 100 spot but aren't in the exclusion list.\n\n" +
                "For each player, provide a JSON object with these EXACT fields:\n" +
                "- rank: integer (use EXACTLY one of these values: " + ranksStr + ")\n" +
                "- name: string (common fan-known name)\n" +
                "- displayName: string (same as name)\n" +
                "- nationality: string\n" +
                "- position: string\n" +
                "- team: string (most iconic team)\n" +
                "- birthYear: integer\n" +
                "- height: string\n" +
                "- weight: string\n" +
                "- isActive: boolean\n" +
                "- rating: integer (0-100)\n" +
                "- biography: string (5-8 sentences — vivid, passionate narrative about their career, " +
                "defining moments, rivalries, records, and why fans worship them)\n" +
                "- careerHighlights: array of strings (5-7 specific achievements with years and stats)\n" +
                "- strengths: array of strings (4-6 descriptive phrases, not single words)\n" +
                "- legacySummary: string (one impactful sentence)\n\n" +
                "Return ONLY a valid JSON array. No markdown. Exactly " + missingRanks.size() + " players.\n" +
                "JSON response:";
    }

    /**
     * Seed a single player (rank 1) for testing purposes.
     * Verifies the full pipeline: AI generation → Wikipedia photo → DB save with ELO.
     */
    public Map<String, Object> seedSinglePlayerTest(Sport sport) {
        log.info("🧪 Test: Seeding single player (rank #1) for {}", sport);
        List<String> alreadySavedNames = new ArrayList<>();
        List<Top100PlayerInfo> players = generatePlayersBatch(sport, 1, 1, alreadySavedNames);

        if (players.isEmpty()) {
            return Map.of("success", false, "error", "AI returned no players");
        }

        Top100PlayerInfo info = players.get(0);
        String displayName = info.getDisplayName() != null ? info.getDisplayName() : info.getName();
        String photoUrl = imageEnrichmentService.findPhotoUrl(displayName, info.getName(), sport.name().toLowerCase());

        // Don't save to DB — just return what WOULD be saved
        double eloScore = info.getRank() != null ? 1800.0 - ((info.getRank() - 1) * 6.06) : 1500.0;

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("success", true);
        result.put("name", info.getName());
        result.put("displayName", info.getDisplayName());
        result.put("rank", info.getRank());
        result.put("eloScore", eloScore);
        result.put("team", info.getTeam());
        result.put("position", info.getPosition());
        result.put("nationality", info.getNationality());
        result.put("photoUrl", photoUrl);
        result.put("hasPhoto", photoUrl != null && !photoUrl.contains("ui-avatars.com"));
        result.put("rating", info.getRating());
        result.put("biography", info.getBiography());
        result.put("isActive", info.getIsActive());
        result.put("birthYear", info.getBirthYear());
        result.put("height", info.getHeight());
        result.put("weight", info.getWeight());
        result.put("strengths", info.getStrengths());
        result.put("careerHighlights", info.getCareerHighlights());
        return result;
    }

    /**
     * Fuzzy duplicate detection: catches genuine duplicates like
     * "zinedine zidane" vs "zinedine yazid zidane" without false-positiving on
     * "roberto carlos" vs "carlos tevez" or "ronaldo" vs "ronaldinho".
     */
    private boolean isFuzzyDuplicate(String newNorm, List<String> savedNames) {
        for (String saved : savedNames) {
            // Exact match
            if (newNorm.equals(saved)) {
                return true;
            }
            // One name is a subset of the other AND they share the same last token.
            // This catches "zidane" vs "zinedine zidane" and
            // "zinedine zidane" vs "zinedine yazid zidane",
            // but NOT "ronaldo" vs "ronaldinho" (different last tokens).
            String[] newTokens = newNorm.split("\\s+");
            String[] savedTokens = saved.split("\\s+");
            String newLast = newTokens[newTokens.length - 1];
            String savedLast = savedTokens[savedTokens.length - 1];

            if (newLast.equals(savedLast)) {
                // Same surname — check if ALL tokens of the shorter name appear in the longer
                String[] shorter = newTokens.length <= savedTokens.length ? newTokens : savedTokens;
                String[] longer = newTokens.length > savedTokens.length ? newTokens : savedTokens;
                Set<String> longerSet = new HashSet<>(java.util.Arrays.asList(longer));
                boolean allMatch = true;
                for (String t : shorter) {
                    if (!longerSet.contains(t)) {
                        allMatch = false;
                        break;
                    }
                }
                if (allMatch) {
                    return true;
                }
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
            "- biography: string (5-8 sentences — write a vivid, passionate narrative about the player's career, " +
            "their defining moments, what made them transcend the sport, their swagger, their rivalries, " +
            "the records they shattered, and why fans worship them. Make the reader FEEL the greatness.)\n" +
            "- careerHighlights: array of strings (5-7 major achievements, be specific with years and stats)\n" +
            "- strengths: array of strings (4-6 detailed strengths — not just one word like 'Dribbling', " +
            "but descriptive phrases like 'Mesmerizing close-control dribbling that leaves defenders rooted to the spot')\n" +
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
