package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.client.OpenRouterClient;
import com.topplayersofallsports.playerservice.dto.ai.PlayerAnalysisResult;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.PlayerStats;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIAnalysisService {
    
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    
    /**
     * Generate AI analysis for a player using DeepSeek R1
     */
    public PlayerAnalysisResult analyzePlayer(Player player, List<PlayerStats> stats) {
        log.info("Generating AI analysis for player: {}", player.getName());
        
        String prompt = buildAnalysisPrompt(player, stats);
        String aiResponse = openRouterClient.chat(prompt, 0.7);
        
        return parseAIResponse(aiResponse, player);
    }
    
    /**
     * Build a comprehensive prompt for player analysis
     */
    private String buildAnalysisPrompt(Player player, List<PlayerStats> stats) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an expert sports analyst. Analyze the following player and provide a structured JSON response.\n\n");
        prompt.append("Player: ").append(player.getName()).append("\n");
        prompt.append("Sport: ").append(player.getSport()).append("\n");
        prompt.append("Team: ").append(player.getTeam()).append("\n");
        prompt.append("Position: ").append(player.getPosition()).append("\n");
        prompt.append("Age: ").append(player.getAge()).append("\n");
        prompt.append("Nationality: ").append(player.getNationality()).append("\n\n");
        
        if (!stats.isEmpty()) {
            prompt.append("Recent Statistics:\n");
            for (PlayerStats stat : stats) {
                prompt.append(String.format("Season %s: %.1f PPG, %.1f RPG, %.1f APG\n", 
                    stat.getSeason(), 
                    stat.getPpg(), 
                    stat.getRpg(), 
                    stat.getApg()));
            }
            prompt.append("\n");
        }
        
        prompt.append("Provide a JSON response with this exact structure:\n");
        prompt.append("{\n");
        prompt.append("  \"rating\": <number 0-100>,\n");
        prompt.append("  \"analysis\": \"<3-4 sentence analysis>\",\n");
        prompt.append("  \"strengths\": [\"strength1\", \"strength2\", \"strength3\"],\n");
        prompt.append("  \"biography\": \"<comprehensive biography paragraph>\",\n");
        prompt.append("  \"careerHighlights\": [\n");
        prompt.append("    {\"title\": \"Achievement\", \"description\": \"Details\", \"year\": \"Year\"}\n");
        prompt.append("  ],\n");
        prompt.append("  \"legacySummary\": \"<1 sentence legacy statement>\"\n");
        prompt.append("}\n\n");
        prompt.append("Rating criteria:\n");
        prompt.append("- Peak performance (30%): Highest level achieved\n");
        prompt.append("- Longevity (20%): Career length and consistency\n");
        prompt.append("- Awards (20%): Championships, MVPs, honors\n");
        prompt.append("- Era-adjusted impact (30%): Historical significance\n\n");
        prompt.append("Respond ONLY with valid JSON, no additional text.");
        
        return prompt.toString();
    }
    
    /**
     * Parse the AI response into structured data
     */
    private PlayerAnalysisResult parseAIResponse(String response, Player player) {
        try {
            // Try to extract JSON from response (DeepSeek R1 might include reasoning)
            String jsonContent = extractJSON(response);
            JsonNode jsonNode = objectMapper.readTree(jsonContent);
            
            PlayerAnalysisResult result = PlayerAnalysisResult.builder()
                .rating(jsonNode.has("rating") ? jsonNode.get("rating").asInt() : 75)
                .analysis(jsonNode.has("analysis") ? jsonNode.get("analysis").asText() : "")
                .biography(jsonNode.has("biography") ? jsonNode.get("biography").asText() : "")
                .legacySummary(jsonNode.has("legacySummary") ? jsonNode.get("legacySummary").asText() : "")
                .build();
            
            // Parse strengths array
            if (jsonNode.has("strengths") && jsonNode.get("strengths").isArray()) {
                List<String> strengths = new ArrayList<>();
                jsonNode.get("strengths").forEach(node -> strengths.add(node.asText()));
                result.setStrengths(strengths);
            }
            
            // Parse career highlights (simple strings array)
            if (jsonNode.has("careerHighlights") && jsonNode.get("careerHighlights").isArray()) {
                List<String> highlights = new ArrayList<>();
                jsonNode.get("careerHighlights").forEach(node -> highlights.add(node.asText()));
                result.setCareerHighlights(highlights);
            }
            
            log.info("Successfully parsed AI analysis for player: {} (Rating: {})", 
                player.getName(), result.getRating());
            
            return result;
            
        } catch (JsonProcessingException e) {
            log.error("Failed to parse AI response as JSON: {}", e.getMessage());
            // Return a basic fallback result
            return createFallbackResult(player);
        }
    }
    
    /**
     * Extract JSON from response (handles DeepSeek R1's reasoning tokens)
     */
    private String extractJSON(String response) {
        // Find the first { and last }
        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');
        
        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }
        
        return response;
    }
    
    /**
     * Create a basic fallback result if AI parsing fails
     */
    private PlayerAnalysisResult createFallbackResult(Player player) {
        return PlayerAnalysisResult.builder()
            .rating(75)
            .analysis("Analysis pending. This player is being evaluated by our AI system.")
            .strengths(List.of("To be determined", "Under evaluation", "Analysis in progress"))
            .biography("Player profile is currently being generated by our AI system.")
            .careerHighlights(new ArrayList<>())
            .legacySummary("Legacy evaluation in progress.")
            .build();
    }
}
