package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.dto.PlayerStatsResponse;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.PlayerStats;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.repository.PlayerStatsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PlayerStatsService {

    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final ObjectMapper objectMapper;
    private final WebClient webClient;

    @Value("${apisports.football.key:}")
    private String apiSportsKey;

    private static final List<String> SEASONS = List.of("2024", "2023", "2022", "2021", "2020");

    public PlayerStatsService(
            PlayerRepository playerRepository,
            PlayerStatsRepository playerStatsRepository,
            ObjectMapper objectMapper,
            @Value("${apisports.football.base-url:https://v3.football.api-sports.io}") String baseUrl) {
        this.playerRepository = playerRepository;
        this.playerStatsRepository = playerStatsRepository;
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                .build();
    }

    public PlayerStatsResponse getStats(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found: " + playerId));

        boolean isFootball = player.getSport() == Sport.FOOTBALL;

        if (isFootball && apiSportsKey != null && !apiSportsKey.isBlank()) {
            return fetchFootballStats(player);
        }

        return fetchFromDatabase(player);
    }

    private PlayerStatsResponse fetchFootballStats(Player player) {
        Map<String, Map<String, Object>> seasonStats = new LinkedHashMap<>();
        int careerGoals = 0, careerAssists = 0, careerApps = 0;

        for (String season : SEASONS) {
            try {
                String response = webClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/players")
                                .queryParam("search", player.getName())
                                .queryParam("season", season)
                                .build())
                        .header("x-rapidapi-key", apiSportsKey)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(30))
                        .block();

                if (response == null || response.isBlank()) continue;

                JsonNode root = objectMapper.readTree(response);
                JsonNode results = root.path("response");
                if (!results.isArray() || results.isEmpty()) continue;

                JsonNode statsArray = results.get(0).path("statistics");
                if (statsArray.isEmpty()) continue;

                JsonNode stats = statsArray.get(0);
                JsonNode goals = stats.path("goals");
                JsonNode games = stats.path("games");

                int scored      = goals.path("total").asInt(0);
                int assists     = goals.path("assists").asInt(0);
                int appearances = games.path("appearences").asInt(0); // API-Sports typo
                int minutes     = games.path("minutes").asInt(0);
                String club     = stats.path("team").path("name").asText(null);

                Map<String, Object> seasonData = new LinkedHashMap<>();
                seasonData.put("goals", scored);
                seasonData.put("assists", assists);
                seasonData.put("appearances", appearances);
                if (minutes > 0) seasonData.put("minutesPlayed", minutes);
                if (club != null) seasonData.put("club", club);

                seasonStats.put(season, seasonData);

                careerGoals   += scored;
                careerAssists += assists;
                careerApps    += appearances;

            } catch (Exception e) {
                log.warn("[PlayerStats] API-Sports fetch failed for {} season {}: {}",
                        player.getName(), season, e.getMessage());
            }
        }

        Map<String, Object> careerTotals = new LinkedHashMap<>();
        careerTotals.put("goals", careerGoals);
        careerTotals.put("assists", careerAssists);
        careerTotals.put("appearances", careerApps);

        return PlayerStatsResponse.builder()
                .playerId(player.getId())
                .seasonStats(seasonStats)
                .careerStats(careerTotals)
                .build();
    }

    private PlayerStatsResponse fetchFromDatabase(Player player) {
        List<PlayerStats> allStats = playerStatsRepository.findByPlayerOrderBySeasonDesc(player);

        Map<String, Map<String, Object>> seasonStats = allStats.stream()
                .filter(s -> !"career".equals(s.getSeason()))
                .collect(Collectors.toMap(
                        PlayerStats::getSeason,
                        s -> buildSeasonMap(s),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        Map<String, Object> careerStats = allStats.stream()
                .filter(s -> "career".equals(s.getSeason()))
                .findFirst()
                .map(s -> buildSeasonMap(s))
                .orElse(Collections.emptyMap());

        return PlayerStatsResponse.builder()
                .playerId(player.getId())
                .seasonStats(seasonStats)
                .careerStats(careerStats)
                .build();
    }

    private Map<String, Object> buildSeasonMap(PlayerStats s) {
        Map<String, Object> map = new LinkedHashMap<>();
        if (s.getPpg() != null) map.put("ppg", s.getPpg());
        if (s.getRpg() != null) map.put("rpg", s.getRpg());
        if (s.getApg() != null) map.put("apg", s.getApg());
        if (s.getOtherStats() != null) map.putAll(s.getOtherStats());
        return map;
    }
}
