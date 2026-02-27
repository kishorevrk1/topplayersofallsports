package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Service to clean up data quality issues in player records
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DataCleanupService {
    
    private final PlayerRepository playerRepository;
    
    // Pattern to detect AI reasoning text (sentences, thinking phrases)
    private static final Pattern AI_REASONING_PATTERN = Pattern.compile(
        "(?i)(okay|alright|let me|i need to|let's|the question|first|break down|figure out|consider|so i|thinking|analyzing)",
        Pattern.CASE_INSENSITIVE
    );
    
    // Pattern to detect valid short names
    private static final Pattern VALID_NAME_PATTERN = Pattern.compile(
        "^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]+(\\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'-]+)*$"
    );
    
    /**
     * Fix all data quality issues across all players
     */
    @Async("taskExecutor")
    public void cleanupAllPlayersAsync() {
        log.info("Starting comprehensive data cleanup for all players...");
        
        List<Player> allPlayers = playerRepository.findAll();
        int totalPlayers = allPlayers.size();
        int fixedAliases = 0;
        int fixedNormalizedNames = 0;
        int fixedDefaults = 0;
        
        for (int i = 0; i < allPlayers.size(); i++) {
            Player player = allPlayers.get(i);
            boolean modified = false;
            
            try {
                // Fix 1: Clean up corrupted normalizedName
                if (player.getNormalizedName() == null || isCorruptedNormalizedName(player.getName(), player.getNormalizedName())) {
                    String correctNormalized = normalizeNameCorrectly(player.getName());
                    log.info("Fixing normalizedName for '{}': '{}' -> '{}'", 
                            player.getName(), player.getNormalizedName(), correctNormalized);
                    player.setNormalizedName(correctNormalized);
                    fixedNormalizedNames++;
                    modified = true;
                }
                
                // Fix 2: Remove AI reasoning from aliases
                if (player.getAliases() != null && !player.getAliases().isEmpty()) {
                    List<String> cleanAliases = new ArrayList<>();
                    for (String alias : player.getAliases()) {
                        if (isValidAlias(alias)) {
                            cleanAliases.add(alias);
                        } else {
                            log.info("Removing invalid alias from '{}': '{}'", 
                                    player.getName(), alias.substring(0, Math.min(50, alias.length())) + "...");
                            fixedAliases++;
                            modified = true;
                        }
                    }
                    player.setAliases(cleanAliases);
                }
                
                // Fix 3: Set sensible defaults for null fields
                if (player.getIsActive() == null) {
                    player.setIsActive(true);
                    fixedDefaults++;
                    modified = true;
                }
                
                if (modified) {
                    playerRepository.save(player);
                }
                
                if ((i + 1) % 10 == 0) {
                    log.info("Cleanup progress: {}/{} players processed", i + 1, totalPlayers);
                }
                
            } catch (Exception e) {
                log.error("Error cleaning up player '{}': {}", player.getName(), e.getMessage());
            }
        }
        
        log.info("✅ Data cleanup complete!");
        log.info("  - Fixed {} normalized names", fixedNormalizedNames);
        log.info("  - Removed {} invalid aliases", fixedAliases);
        log.info("  - Fixed {} default values", fixedDefaults);
    }
    
    /**
     * Check if normalizedName is corrupted (missing first letters)
     */
    private boolean isCorruptedNormalizedName(String originalName, String normalizedName) {
        if (normalizedName == null || normalizedName.isBlank()) {
            return true;
        }
        
        String expected = normalizeNameCorrectly(originalName);
        
        // Check if first letter is missing
        if (!expected.isBlank() && !normalizedName.startsWith(String.valueOf(expected.charAt(0)))) {
            return true;
        }
        
        // Check if normalized is much shorter than expected
        if (normalizedName.length() < expected.length() * 0.7) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Correct normalization - preserves first letters
     */
    public String normalizeNameCorrectly(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        
        // Step 1: Decompose to NFD form
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        
        // Step 2: Remove ONLY combining diacritical marks (category Mn - Mark, nonspacing)
        // This preserves base letters while removing accents
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            // Keep the character if it's NOT a combining mark
            if (Character.getType(c) != Character.NON_SPACING_MARK) {
                result.append(c);
            }
        }
        
        return result.toString()
            .toLowerCase()
            .replaceAll("[^a-z0-9\\s]", "") // Remove special chars but keep letters/numbers/spaces
            .replaceAll("\\s+", " ") // Normalize whitespace
            .trim();
    }
    
    /**
     * Check if an alias is valid (not AI reasoning)
     */
    private boolean isValidAlias(String alias) {
        if (alias == null || alias.isBlank()) {
            return false;
        }
        
        String trimmed = alias.trim();
        
        // Too long to be a name
        if (trimmed.length() > 50) {
            return false;
        }
        
        // Contains AI reasoning phrases
        if (AI_REASONING_PATTERN.matcher(trimmed).find()) {
            return false;
        }
        
        // Contains sentence-like structure (multiple sentences, punctuation patterns)
        if (trimmed.contains(". ") || trimmed.contains("? ") || trimmed.contains("! ")) {
            return false;
        }
        
        // Too many words (names usually have 1-4 words)
        String[] words = trimmed.split("\\s+");
        if (words.length > 5) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Get cleanup status/statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDataQualityStats() {
        List<Player> allPlayers = playerRepository.findAll();
        
        int corruptedNormalizedNames = 0;
        int invalidAliases = 0;
        int nullIsActive = 0;
        int nullCurrentRank = 0;
        int nullRankingScore = 0;
        int nullHeight = 0;
        int nullWeight = 0;
        int nullPhotoUrl = 0;
        
        for (Player player : allPlayers) {
            if (isCorruptedNormalizedName(player.getName(), player.getNormalizedName())) {
                corruptedNormalizedNames++;
            }
            
            if (player.getAliases() != null) {
                for (String alias : player.getAliases()) {
                    if (!isValidAlias(alias)) {
                        invalidAliases++;
                    }
                }
            }
            
            if (player.getIsActive() == null) nullIsActive++;
            if (player.getCurrentRank() == null) nullCurrentRank++;
            if (player.getRankingScore() == null) nullRankingScore++;
            if (player.getHeight() == null) nullHeight++;
            if (player.getWeight() == null) nullWeight++;
            if (player.getPhotoUrl() == null) nullPhotoUrl++;
        }
        
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPlayers", allPlayers.size());
        stats.put("issues", Map.of(
            "corruptedNormalizedNames", corruptedNormalizedNames,
            "invalidAliases", invalidAliases,
            "nullIsActive", nullIsActive
        ));
        stats.put("missingData", Map.of(
            "nullCurrentRank", nullCurrentRank,
            "nullRankingScore", nullRankingScore,
            "nullHeight", nullHeight,
            "nullWeight", nullWeight,
            "nullPhotoUrl", nullPhotoUrl
        ));
        
        return stats;
    }
}
