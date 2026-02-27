package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerDisplayNameService {
    
    private final OpenRouterClient openRouterClient;
    private final PlayerRepository playerRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * Use AI to get proper display name for a player
     */
    public String getProperDisplayName(String fullName, String sport) {
        log.info("Getting proper display name for: {}", fullName);
        
        String prompt = String.format("""
            TASK: Return ONLY the commonly used name for this footballer.
            
            Footballer: "%s"
            Sport: %s
            
            CRITICAL INSTRUCTIONS:
            1. Return ONLY 1-3 words (the name fans use)
            2. NO explanations, NO reasoning, NO sentences
            3. Just the name itself
            
            Examples:
            - Input: "Lionel Andrés Messi Cuccittini" → Output: "Lionel Messi"
            - Input: "Cristiano Ronaldo dos Santos Aveiro" → Output: "Cristiano Ronaldo"
            - Input: "Vinícius José Paixão de Oliveira Júnior" → Output: "Vinicius Jr"
            - Input: "Kevin De Bruyne" → Output: "Kevin De Bruyne"
            - Input: "Neymar da Silva Santos Júnior" → Output: "Neymar"
            
            Your response (ONLY THE NAME):
            """, fullName, sport);
        
        try {
            // Use GPT-4o mini for simple extraction (not DeepSeek R1 which shows reasoning)
            // OpenRouter model: openai/gpt-4o-mini (fast, cheap, no reasoning text)
            String response = openRouterClient.chat(prompt, 0.3, "openai/gpt-4o-mini");
            String displayName = extractDisplayNameFromAIResponse(response, fullName);
            
            // Validate: display name should be short (max 100 chars)
            if (displayName.length() > 100) {
                log.warn("AI returned too long display name ({}), using fallback", displayName.length());
                return extractFallbackDisplayName(fullName);
            }
            
            log.info("AI suggests display name: {} -> {}", fullName, displayName);
            return displayName;
            
        } catch (Exception e) {
            log.error("Failed to get display name from AI: {}", e.getMessage());
            // Fallback: extract most recognizable part
            return extractFallbackDisplayName(fullName);
        }
    }
    
    /**
     * Extract clean display name from AI response (handles DeepSeek R1 reasoning)
     */
    private String extractDisplayNameFromAIResponse(String aiResponse, String fullName) {
        if (aiResponse == null || aiResponse.isBlank()) {
            return extractFallbackDisplayName(fullName);
        }
        
        // Remove common AI prefixes
        String cleaned = aiResponse.trim()
            .replaceAll("(?i)^(Answer:|Response:|Output:|Result:|The name is|The player is called|Commonly known as):?\\s*", "")
            .replaceAll("^[\"']|[\"']$", "") // Remove quotes
            .trim();
        
        // If response contains multiple lines or long explanation, try to extract the name
        if (cleaned.length() > 100 || cleaned.contains("\n")) {
            // Look for patterns like "The answer is X" or final line
            String[] lines = cleaned.split("\n");
            
            // Check last line first (often the answer)
            String lastLine = lines[lines.length - 1].trim();
            if (lastLine.length() < 50 && containsNameWords(lastLine)) {
                return cleanupName(lastLine);
            }
            
            // Look for quoted names
            if (cleaned.contains("\"")) {
                int firstQuote = cleaned.indexOf("\"");
                int lastQuote = cleaned.lastIndexOf("\"");
                if (firstQuote != -1 && lastQuote > firstQuote) {
                    String quoted = cleaned.substring(firstQuote + 1, lastQuote).trim();
                    if (quoted.length() < 50 && containsNameWords(quoted)) {
                        return cleanupName(quoted);
                    }
                }
            }
            
            // Fallback: take first line if short enough
            String firstLine = lines[0].trim();
            if (firstLine.length() < 50 && containsNameWords(firstLine)) {
                return cleanupName(firstLine);
            }
            
            // Give up, use fallback
            log.warn("Could not extract display name from AI response, using fallback");
            return extractFallbackDisplayName(fullName);
        }
        
        return cleanupName(cleaned);
    }
    
    /**
     * Check if text contains name-like words (capitalized, not full sentences)
     */
    private boolean containsNameWords(String text) {
        if (text == null || text.isBlank()) return false;
        
        // Should have at least one capital letter
        if (!text.matches(".*[A-Z].*")) return false;
        
        // Should not be a full sentence (no periods followed by space, no "is", "the", etc. at start)
        if (text.matches("(?i)^(the|this|he|she|it|they)\\s.*")) return false;
        
        // Should be relatively short
        String[] words = text.split("\\s+");
        return words.length >= 1 && words.length <= 5;
    }
    
    /**
     * Clean up extracted name
     */
    private String cleanupName(String name) {
        return name.trim()
            .replaceAll("\\.$", "") // Remove trailing period
            .replaceAll("^[\"']|[\"']$", "") // Remove quotes
            .replaceAll("\\s+", " ") // Normalize spaces
            .trim();
    }
    
    /**
     * Async wrapper for backfill - managed by Spring's thread pool
     */
    @Async("aiTaskExecutor")
    public void backfillAllDisplayNamesAsync() {
        log.info("Starting async display name backfill");
        try {
            backfillAllDisplayNames();
        } catch (Exception e) {
            log.error("Async display name backfill failed: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Backfill display names for all players using AI
     */
    public void backfillAllDisplayNames() {
        log.info("Starting display name backfill for all players");
        
        List<Player> allPlayers = playerRepository.findAll();
        int updated = 0;
        
        for (Player player : allPlayers) {
            try {
                String properDisplayName = getProperDisplayName(player.getName(), player.getSport().name());
                
                if (!properDisplayName.equals(player.getDisplayName())) {
                    // Add old display name as alias if it exists
                    if (player.getDisplayName() != null && !player.getDisplayName().isBlank()) {
                        if (!player.getAliases().contains(player.getDisplayName())) {
                            player.getAliases().add(player.getDisplayName());
                        }
                    }
                    
                    player.setDisplayName(properDisplayName);
                    playerRepository.save(player);
                    updated++;
                    
                    log.info("Updated player {}: {} -> {}", 
                            player.getId(), player.getName(), properDisplayName);
                    
                    // Rate limiting - don't overwhelm API
                    Thread.sleep(2000); // 2 seconds between calls
                }
                
            } catch (Exception e) {
                log.error("Failed to update player {}: {}", player.getId(), e.getMessage());
            }
        }
        
        log.info("Display name backfill complete: {} players updated", updated);
    }
    
    /**
     * Fallback display name extraction (rule-based)
     */
    private String extractFallbackDisplayName(String fullName) {
        String[] parts = fullName.split("\\s+");
        
        // If short name (1-2 words), return as-is
        if (parts.length <= 2) {
            return fullName;
        }
        
        // For longer names, try to extract recognizable part
        // Common patterns:
        // - "FirstName MiddleName LastName" -> "FirstName LastName"
        // - "FirstName ... Júnior" -> "FirstName Jr"
        
        if (fullName.toLowerCase().contains("júnior") || fullName.toLowerCase().contains("junior")) {
            return parts[0] + " Jr";
        }
        
        // Default: first + second-to-last word (often the surname before compound parts)
        if (parts.length >= 3) {
            return parts[0] + " " + parts[parts.length - 2];
        }
        
        return parts[0] + " " + parts[parts.length - 1];
    }
}
