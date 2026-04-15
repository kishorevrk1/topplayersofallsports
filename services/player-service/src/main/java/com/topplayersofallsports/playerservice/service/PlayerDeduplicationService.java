package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.dto.DuplicateCheckResult;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerDeduplicationService {
    
    private final PlayerRepository playerRepository;
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    
    private static final double FUZZY_MATCH_THRESHOLD = 0.85; // 85% similarity
    private static final double AI_CONFIDENCE_THRESHOLD = 0.80; // 80% confidence
    
    /**
     * Multi-level duplicate check
     */
    public DuplicateCheckResult checkForDuplicate(
            String playerName, 
            Sport sport, 
            String nationality,
            LocalDate dateOfBirth) {
        
        log.debug("Checking for duplicate: {} ({}) - {}", playerName, sport, nationality);
        
        // Level 1: Canonical ID match (most reliable)
        if (nationality != null && dateOfBirth != null) {
            String canonicalId = generateCanonicalId(playerName, nationality, dateOfBirth);
            Player exactMatch = playerRepository.findByCanonicalId(canonicalId).orElse(null);
            
            if (exactMatch != null) {
                log.info("Exact canonical match found: {} -> {}", playerName, exactMatch.getName());
                return DuplicateCheckResult.exactMatch(exactMatch.getId(), exactMatch.getName());
            }
        }
        
        // Level 2: Check aliases (nicknames, alternate names)
        List<Player> aliasMatches = playerRepository.findByAlias(playerName, sport);
        if (!aliasMatches.isEmpty()) {
            Player match = aliasMatches.get(0);
            log.info("Alias match found: {} is alias of {}", playerName, match.getName());
            return DuplicateCheckResult.exactMatch(match.getId(), match.getName());
        }
        
        // Level 3: Normalized name match
        String normalized = normalizeName(playerName);
        List<Player> normalizedMatches = playerRepository
            .findByNormalizedNameAndSport(normalized, sport);
        
        if (normalizedMatches.size() == 1) {
            // Single exact normalized match - very likely same player
            Player match = normalizedMatches.get(0);
            log.info("Normalized name match: {} -> {}", playerName, match.getName());
            return DuplicateCheckResult.fuzzyMatch(match, 0.95);
        }
        
        // Level 4: Fuzzy matching (Levenshtein distance)
        List<Player> allPlayers = playerRepository.findBySport(sport);
        Player fuzzyMatch = findBestFuzzyMatch(playerName, allPlayers);
        
        if (fuzzyMatch != null) {
            double similarity = calculateSimilarity(playerName, fuzzyMatch.getName());
            if (similarity >= FUZZY_MATCH_THRESHOLD) {
                log.info("Fuzzy match found: {} -> {} ({}% similar)", 
                        playerName, fuzzyMatch.getName(), (int)(similarity * 100));
                return DuplicateCheckResult.fuzzyMatch(fuzzyMatch, similarity);
            }
        }
        
        // Level 5: AI semantic verification (for uncertain cases)
        if (!normalizedMatches.isEmpty() || fuzzyMatch != null) {
            List<Player> candidates = normalizedMatches.isEmpty() 
                ? List.of(fuzzyMatch) 
                : normalizedMatches;
            
            try {
                return aiVerifyDuplicate(playerName, candidates, sport);
            } catch (Exception e) {
                log.warn("AI verification failed: {}", e.getMessage());
                // Fall through to possible match
                return DuplicateCheckResult.possibleMatch(candidates);
            }
        }
        
        log.debug("No duplicate found for: {}", playerName);
        return DuplicateCheckResult.noDuplicate();
    }
    
    /**
     * Ask AI: "Are these the same player?"
     */
    private DuplicateCheckResult aiVerifyDuplicate(
            String newPlayerName, 
            List<Player> candidates,
            Sport sport) {
        
        log.debug("Using AI to verify duplicate for: {}", newPlayerName);
        
        StringBuilder candidatesText = new StringBuilder();
        for (int i = 0; i < candidates.size(); i++) {
            Player p = candidates.get(i);
            candidatesText.append(String.format(
                "%d. ID: %d, Name: \"%s\", Team: %s, Nationality: %s, DOB: %s\n",
                i + 1, p.getId(), p.getName(), p.getTeam(), 
                p.getNationality(), p.getBirthdate()
            ));
        }
        
        String prompt = String.format("""
            You are a sports data expert. Determine if these are the SAME player or DIFFERENT players.
            
            New Player to Register: "%s"
            Sport: %s
            
            Existing Players in Database:
            %s
            
            Consider:
            - Full names vs nicknames (e.g., "Vinicius Jr" = "Vinícius José Paixão de Oliveira Júnior")
            - Name variations, spellings, and accents
            - Date of birth and nationality (if available)
            - Common abbreviations (e.g., "K. Mbappé" = "Kylian Mbappé")
            
            Return ONLY this JSON structure, nothing else:
            {
              "isDuplicate": true or false,
              "matchedPlayerId": player ID number or null,
              "confidence": 0.0 to 1.0,
              "reason": "brief explanation"
            }
            """, newPlayerName, sport, candidatesText);
        
        try {
            String aiResponse = openRouterClient.chat(prompt);
            String jsonStr = extractJson(aiResponse);
            JsonNode jsonNode = objectMapper.readTree(jsonStr);
            
            boolean isDuplicate = jsonNode.get("isDuplicate").asBoolean();
            Long matchedId = jsonNode.has("matchedPlayerId") && !jsonNode.get("matchedPlayerId").isNull()
                ? jsonNode.get("matchedPlayerId").asLong()
                : null;
            double confidence = jsonNode.get("confidence").asDouble();
            String reason = jsonNode.get("reason").asText();
            
            if (isDuplicate && matchedId != null && confidence >= AI_CONFIDENCE_THRESHOLD) {
                Player matched = candidates.stream()
                    .filter(p -> p.getId().equals(matchedId))
                    .findFirst()
                    .orElse(null);
                
                if (matched != null) {
                    log.info("AI confirmed duplicate: {} -> {} (confidence: {})", 
                            newPlayerName, matched.getName(), confidence);
                    return DuplicateCheckResult.aiVerified(true, matchedId, matched.getName(), confidence, reason);
                }
            }
            
            log.info("AI confirmed NOT duplicate: {} (confidence: {})", newPlayerName, confidence);
            return DuplicateCheckResult.aiVerified(false, null, null, confidence, reason);
            
        } catch (Exception e) {
            log.error("Failed to parse AI verification response: {}", e.getMessage(), e);
            throw new RuntimeException("AI verification failed", e);
        }
    }
    
    /**
     * Find best fuzzy match using Levenshtein distance
     */
    private Player findBestFuzzyMatch(String playerName, List<Player> candidates) {
        Player bestMatch = null;
        double bestSimilarity = 0.0;
        
        String normalized = normalizeName(playerName);
        
        for (Player candidate : candidates) {
            double similarity = calculateSimilarity(normalized, normalizeName(candidate.getName()));
            
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = candidate;
            }
        }
        
        return bestSimilarity >= FUZZY_MATCH_THRESHOLD ? bestMatch : null;
    }
    
    /**
     * Calculate similarity between two strings (0.0 to 1.0)
     * Using Levenshtein distance
     */
    private double calculateSimilarity(String s1, String s2) {
        String longer = s1.length() > s2.length() ? s1 : s2;
        String shorter = s1.length() > s2.length() ? s2 : s1;
        
        if (longer.length() == 0) {
            return 1.0;
        }
        
        int editDistance = levenshteinDistance(longer, shorter);
        return (longer.length() - editDistance) / (double) longer.length();
    }
    
    /**
     * Calculate Levenshtein distance between two strings
     */
    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }
        
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                
                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        
        return dp[s1.length()][s2.length()];
    }
    
    /**
     * Generate canonical ID from player identity
     */
    public String generateCanonicalId(String name, String nationality, LocalDate dateOfBirth) {
        String normalized = normalizeName(name);
        String dobStr = dateOfBirth != null ? dateOfBirth.toString() : "unknown";
        String nat = nationality != null ? nationality.toLowerCase() : "unknown";
        
        String identity = normalized + "|" + nat + "|" + dobStr;
        return DigestUtils.sha256Hex(identity);
    }
    
    /**
     * Normalize name: remove accents, lowercase, trim
     * Fixed to properly handle NFD decomposition - preserves base letters
     */
    public String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        
        // Step 1: Decompose to NFD form (e.g., é -> e + combining accent)
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        
        // Step 2: Remove ONLY combining diacritical marks (category Mn - Mark, nonspacing)
        // This preserves base letters while removing accents
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            // Keep the character if it's NOT a combining mark (type 6 = NON_SPACING_MARK)
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
     * Extract JSON from AI response
     */
    private String extractJson(String aiResponse) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return "{}";
        }
        
        // Find first { and last }
        int firstBrace = aiResponse.indexOf('{');
        int lastBrace = aiResponse.lastIndexOf('}');
        
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return aiResponse.substring(firstBrace, lastBrace + 1);
        }
        
        return aiResponse.trim();
    }
}
