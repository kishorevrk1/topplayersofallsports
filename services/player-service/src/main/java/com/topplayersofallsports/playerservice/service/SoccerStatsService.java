package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Fetches real football/soccer player statistics from API-Sports.io.
 *
 * Stats are used as context injected into AI prompts so models reason from
 * actual data rather than purely from training knowledge.
 *
 * Results are cached in Redis for 24 hours to stay within the free API quota.
 */
@Service
@Slf4j
public class SoccerStatsService {

    private static final int CURRENT_SEASON = 2024;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${apisports.football.key:}")
    private String apiKey;

    public SoccerStatsService(
            @Value("${apisports.football.base-url:https://v3.football.api-sports.io}") String baseUrl,
            @Value("${apisports.football.timeout-seconds:30}") int timeoutSeconds,
            ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
            .baseUrl(baseUrl)
            .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
            .build();
    }

    /**
     * Fetch a plain-text stats context string for a football player, suitable for injection
     * into an AI prompt. Returns null if the API key is not configured or the request fails.
     *
     * Cached in Redis under "soccer-stats::{playerName}" for 24 hours (86400000 ms TTL).
     *
     * Example return value:
     *   "Season 2024 stats (API-Sports): 18 goals, 12 assists, 30 appearances, 2,700 minutes played. Club: Inter Miami."
     */
    @Cacheable(value = "soccer-stats", key = "#playerName.toLowerCase().trim()", unless = "#result == null")
    public String getPlayerStatsContext(String playerName) {
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("API-Sports key not configured — skipping soccer stats fetch for {}", playerName);
            return null;
        }

        log.info("[SoccerStats] Fetching stats for '{}' (season {})", playerName, CURRENT_SEASON);

        try {
            String response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/players")
                    .queryParam("search", playerName)
                    .queryParam("season", CURRENT_SEASON)
                    .build())
                .header("x-rapidapi-key", apiKey)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(30))
                .block();

            if (response == null || response.isBlank()) {
                log.warn("[SoccerStats] Empty response for {}", playerName);
                return null;
            }

            return parseStatsToContext(response, playerName);

        } catch (Exception e) {
            log.warn("[SoccerStats] Failed to fetch stats for {}: {}", playerName, e.getMessage());
            return null; // graceful degradation — AI still works without context
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private String parseStatsToContext(String jsonResponse, String playerName) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode results = root.path("response");

            if (!results.isArray() || results.isEmpty()) {
                log.debug("[SoccerStats] No results found for {}", playerName);
                return null;
            }

            JsonNode first = results.get(0);
            JsonNode statsArray = first.path("statistics");

            if (statsArray.isEmpty()) return null;

            JsonNode stats = statsArray.get(0);
            JsonNode games = stats.path("games");
            JsonNode goals = stats.path("goals");

            String club = stats.path("team").path("name").asText("Unknown club");
            int appearances = games.path("appearences").asInt(0);
            int minutesPlayed = games.path("minutes").asInt(0);
            int goalsScored = goals.path("total").asInt(0);
            int assistsTotal = goals.path("assists").asInt(0);

            List<String> lines = new ArrayList<>();
            lines.add(String.format("Season %d stats (source: API-Sports.io):", CURRENT_SEASON));
            lines.add(String.format("  Club: %s", club));
            if (appearances > 0) lines.add(String.format("  Appearances: %d", appearances));
            if (minutesPlayed > 0) lines.add(String.format("  Minutes played: %,d", minutesPlayed));
            if (goalsScored > 0) lines.add(String.format("  Goals: %d", goalsScored));
            if (assistsTotal > 0) lines.add(String.format("  Assists: %d", assistsTotal));

            String context = String.join("\n", lines);
            log.info("[SoccerStats] Context built for {}: {}", playerName, context);
            return context;

        } catch (Exception e) {
            log.warn("[SoccerStats] Failed to parse stats for {}: {}", playerName, e.getMessage());
            return null;
        }
    }
}
