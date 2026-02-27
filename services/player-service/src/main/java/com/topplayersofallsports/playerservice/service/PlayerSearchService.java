package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.dto.ai.PlayerSearchResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * AI-powered player search service
 * Uses DeepSeek R1 to intelligently search and validate player information
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerSearchService {
    
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    
    /**
     * Use AI to search for player and extract structured information
     */
    public PlayerSearchResult searchPlayer(String playerName, String sport, String additionalHints) {
        log.info("AI Search: Searching for player '{}'", playerName);
        
        String prompt = buildSearchPrompt(playerName, sport, additionalHints);
        String aiResponse = openRouterClient.chat(prompt, 0.3); // Lower temperature for factual accuracy
        
        return parseSearchResult(aiResponse, playerName);
    }
    
    /**
     * Build AI prompt for player search
     */
    private String buildSearchPrompt(String playerName, String sport, String hints) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are a sports knowledge expert. Search for and validate information about this athlete.\n\n");
        prompt.append("Player Name: ").append(playerName).append("\n");
        
        if (sport != null && !sport.isBlank()) {
            prompt.append("Sport (hint): ").append(sport).append("\n");
        }
        
        if (hints != null && !hints.isBlank()) {
            prompt.append("Additional Info: ").append(hints).append("\n");
        }
        
        prompt.append("\nProvide a JSON response with this exact structure:\n");
        prompt.append("{\n");
        prompt.append("  \"fullName\": \"<official full name>\",\n");
        prompt.append("  \"commonName\": \"<how they're commonly known>\",\n");
        prompt.append("  \"sport\": \"<FOOTBALL|BASKETBALL|MMA|CRICKET|TENNIS>\",\n");
        prompt.append("  \"currentTeam\": \"<current team/club>\",\n");
        prompt.append("  \"nationality\": \"<nationality>\",\n");
        prompt.append("  \"position\": \"<playing position>\",\n");
        prompt.append("  \"searchQuery\": \"<best search term for API-Sports.io>\",\n");
        prompt.append("  \"estimatedAge\": <age as number>,\n");
        prompt.append("  \"careerSummary\": \"<1-2 sentence career summary>\",\n");
        prompt.append("  \"isActivePlayer\": <true|false>\n");
        prompt.append("}\n\n");
        prompt.append("IMPORTANT:\n");
        prompt.append("- Use exact sport names from the enum\n");
        prompt.append("- searchQuery should be the name format API-Sports.io expects\n");
        prompt.append("- If player not found or ambiguous, set isActivePlayer to false\n");
        prompt.append("- Only respond with valid JSON, no additional text\n");
        
        return prompt.toString();
    }
    
    /**
     * Parse AI response into structured search result
     */
    private PlayerSearchResult parseSearchResult(String response, String originalName) {
        try {
            String jsonContent = extractJSON(response);
            JsonNode jsonNode = objectMapper.readTree(jsonContent);
            
            PlayerSearchResult result = PlayerSearchResult.builder()
                .fullName(getJsonString(jsonNode, "fullName", originalName))
                .commonName(getJsonString(jsonNode, "commonName", originalName))
                .sport(getJsonString(jsonNode, "sport", "UNKNOWN"))
                .currentTeam(getJsonString(jsonNode, "currentTeam", "Unknown"))
                .nationality(getJsonString(jsonNode, "nationality", "Unknown"))
                .position(getJsonString(jsonNode, "position", "Unknown"))
                .searchQuery(getJsonString(jsonNode, "searchQuery", originalName))
                .estimatedAge(jsonNode.has("estimatedAge") ? jsonNode.get("estimatedAge").asInt() : null)
                .careerSummary(getJsonString(jsonNode, "careerSummary", ""))
                .isActivePlayer(jsonNode.has("isActivePlayer") && jsonNode.get("isActivePlayer").asBoolean())
                .build();
            
            log.info("AI Search Result: {} - {} ({}) - Active: {}", 
                result.getFullName(), result.getSport(), result.getCurrentTeam(), result.isActivePlayer());
            
            return result;
            
        } catch (JsonProcessingException e) {
            log.error("Failed to parse AI search response: {}", e.getMessage());
            return createFallbackResult(originalName);
        }
    }
    
    /**
     * Extract JSON from AI response
     */
    private String extractJSON(String response) {
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');
        
        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }
        
        return response;
    }
    
    /**
     * Safely get string from JSON node
     */
    private String getJsonString(JsonNode node, String field, String defaultValue) {
        return node.has(field) && !node.get(field).isNull() 
            ? node.get(field).asText() 
            : defaultValue;
    }
    
    /**
     * Create fallback result if AI fails
     */
    private PlayerSearchResult createFallbackResult(String playerName) {
        return PlayerSearchResult.builder()
            .fullName(playerName)
            .commonName(playerName)
            .sport("UNKNOWN")
            .searchQuery(playerName)
            .isActivePlayer(false)
            .careerSummary("Unable to validate player information")
            .build();
    }
}
