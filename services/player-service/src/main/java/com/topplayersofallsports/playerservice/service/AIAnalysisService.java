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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class AIAnalysisService {
    
    private final OpenRouterClient openRouterClient;
    private final ObjectMapper objectMapper;
    
    /**
     * Generate AI analysis for a player (single model, for backwards compatibility)
     */
    public PlayerAnalysisResult analyzePlayer(Player player, List<PlayerStats> stats) {
        return analyzePlayerWithContext(player, stats, null);
    }

    /**
     * Generate AI analysis with optional real-world stats context injected into the prompt.
     * contextData can be a plain-text summary of real stats (e.g. from API-Sports).
     */
    public PlayerAnalysisResult analyzePlayerWithContext(Player player, List<PlayerStats> stats, String contextData) {
        log.info("Generating AI analysis for player: {}", player.getName());

        String prompt = buildAnalysisPrompt(player, stats, contextData);
        String aiResponse = openRouterClient.chat(prompt, 0.3);

        return parseAIResponse(aiResponse, player);
    }

    /**
     * Build the transparent criteria-breakdown prompt that forces the AI to score each criterion separately.
     * contextData is optional real-world stats from API-Sports (injected for soccer players).
     */
    public String buildAnalysisPrompt(Player player, List<PlayerStats> stats, String contextData) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are a world-class sports analyst. Rate this player objectively based on their entire career up to 2025.\n\n");
        prompt.append("Player: ").append(player.getName()).append("\n");
        prompt.append("Sport: ").append(player.getSport()).append("\n");
        if (player.getTeam() != null) prompt.append("Team: ").append(player.getTeam()).append("\n");
        if (player.getPosition() != null) prompt.append("Position: ").append(player.getPosition()).append("\n");
        if (player.getAge() != null) prompt.append("Age: ").append(player.getAge()).append("\n");
        if (player.getNationality() != null) prompt.append("Nationality: ").append(player.getNationality()).append("\n");

        if (contextData != null && !contextData.isBlank()) {
            prompt.append("\nVerified Stats Context:\n").append(contextData).append("\n");
        }

        if (stats != null && !stats.isEmpty()) {
            prompt.append("\nHistorical Statistics:\n");
            for (PlayerStats stat : stats) {
                prompt.append(String.format("Season %s: %.1f PPG/Goals, %.1f RPG/Assists, %.1f APG\n",
                    stat.getSeason(), stat.getPpg(), stat.getRpg(), stat.getApg()));
            }
        }

        prompt.append("\nReturn ONLY valid JSON — absolutely no text outside the JSON object:\n");
        prompt.append("{\n");
        prompt.append("  \"rating\": <overall 0-100>,\n");
        prompt.append("  \"criteriaScores\": {\n");
        prompt.append("    \"peakPerformance\": <0-30, weight 30%>,\n");
        prompt.append("    \"longevity\": <0-20, weight 20%>,\n");
        prompt.append("    \"awardsAndTitles\": <0-20, weight 20%>,\n");
        prompt.append("    \"eraAdjustedImpact\": <0-30, weight 30%>\n");
        prompt.append("  },\n");
        prompt.append("  \"confidence\": \"HIGH or MEDIUM or LOW\",\n");
        prompt.append("  \"reasoning\": \"<2-3 sentences explaining the overall score>\",\n");
        prompt.append("  \"dataPointsCited\": [\"<specific fact 1>\", \"<specific fact 2>\", \"<specific fact 3>\"],\n");
        prompt.append("  \"caveats\": \"<any uncertainty or data limitations>\",\n");
        prompt.append("  \"strengths\": [\"<strength1>\", \"<strength2>\", \"<strength3>\"],\n");
        prompt.append("  \"biography\": \"<comprehensive career biography paragraph>\",\n");
        prompt.append("  \"careerHighlights\": [\"<highlight1>\", \"<highlight2>\", \"<highlight3>\"],\n");
        prompt.append("  \"legacySummary\": \"<1 sentence legacy statement>\"\n");
        prompt.append("}\n\n");
        prompt.append("Scoring rules:\n");
        prompt.append("- peakPerformance (0-30): Best season/tournament performance, records set at peak\n");
        prompt.append("- longevity (0-20): Years competing at elite level, consistency across seasons\n");
        prompt.append("- awardsAndTitles (0-20): Championships, individual awards, MVP titles, hall of fame\n");
        prompt.append("- eraAdjustedImpact (0-30): Dominance relative to peers, influence on the sport\n");
        prompt.append("- The sum of criteriaScores should equal the overall rating.\n");
        prompt.append("- dataPointsCited must be specific verifiable facts (years, stats, titles).\n");
        prompt.append("- Respond ONLY with the JSON object, no markdown, no commentary.");

        return prompt.toString();
    }

    /**
     * Kept for callers that don't need contextData
     */
    private String buildAnalysisPrompt(Player player, List<PlayerStats> stats) {
        return buildAnalysisPrompt(player, stats, null);
    }
    
    /**
     * Parse the AI response into structured data, including new criteriaScores fields.
     */
    public PlayerAnalysisResult parseAIResponse(String response, Player player) {
        try {
            String jsonContent = extractJSON(response);
            JsonNode jsonNode = objectMapper.readTree(jsonContent);

            PlayerAnalysisResult result = PlayerAnalysisResult.builder()
                .rating(jsonNode.has("rating") ? jsonNode.get("rating").asInt() : 75)
                .analysis(jsonNode.has("reasoning") ? jsonNode.get("reasoning").asText()
                        : (jsonNode.has("analysis") ? jsonNode.get("analysis").asText() : ""))
                .biography(jsonNode.has("biography") ? jsonNode.get("biography").asText() : "")
                .legacySummary(jsonNode.has("legacySummary") ? jsonNode.get("legacySummary").asText() : "")
                .build();

            // Extract strengths
            if (jsonNode.has("strengths") && jsonNode.get("strengths").isArray()) {
                List<String> strengths = new ArrayList<>();
                jsonNode.get("strengths").forEach(node -> strengths.add(node.asText()));
                result.setStrengths(strengths);
            }

            // Extract career highlights (flat string array)
            if (jsonNode.has("careerHighlights") && jsonNode.get("careerHighlights").isArray()) {
                List<String> highlights = new ArrayList<>();
                jsonNode.get("careerHighlights").forEach(node -> {
                    // Handle both plain strings and nested objects {"title":...}
                    if (node.isTextual()) {
                        highlights.add(node.asText());
                    } else if (node.has("title")) {
                        highlights.add(node.get("title").asText());
                    }
                });
                result.setCareerHighlights(highlights);
            }

            log.info("Successfully parsed AI analysis for player: {} (Rating: {})",
                player.getName(), result.getRating());

            return result;

        } catch (JsonProcessingException e) {
            log.error("Failed to parse AI response as JSON: {}", e.getMessage());
            return createFallbackResult(player);
        }
    }

    /**
     * Extract the criteriaScores block from an AI response JSON string.
     * Returns a JSON string like {"peakPerformance":28.5,"longevity":18.2,...} or null on failure.
     */
    public String extractCriteriaBreakdown(String response) {
        try {
            String jsonContent = extractJSON(response);
            JsonNode jsonNode = objectMapper.readTree(jsonContent);
            if (jsonNode.has("criteriaScores")) {
                return objectMapper.writeValueAsString(jsonNode.get("criteriaScores"));
            }
        } catch (Exception e) {
            log.warn("Could not extract criteriaScores from AI response: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Extract a string field from an AI response JSON.
     */
    public String extractField(String response, String fieldName) {
        try {
            String jsonContent = extractJSON(response);
            JsonNode jsonNode = objectMapper.readTree(jsonContent);
            if (jsonNode.has(fieldName)) {
                JsonNode field = jsonNode.get(fieldName);
                if (field.isArray()) {
                    return objectMapper.writeValueAsString(field);
                }
                return field.asText();
            }
        } catch (Exception e) {
            log.warn("Could not extract field '{}' from AI response", fieldName);
        }
        return null;
    }

    /**
     * Extract the numeric rating from a raw AI response string.
     */
    public double extractRating(String response) {
        try {
            String jsonContent = extractJSON(response);
            JsonNode jsonNode = objectMapper.readTree(jsonContent);
            if (jsonNode.has("rating")) {
                return jsonNode.get("rating").asDouble(75.0);
            }
        } catch (Exception e) {
            log.warn("Could not extract rating from AI response, defaulting to 75");
        }
        return 75.0;
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
