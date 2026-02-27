package com.topplayers.calendar.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.topplayers.calendar.config.LeagueConfig;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * API-Sports.io Client
 * Handles all external API calls with retry logic and error handling
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApiSportsClient {

    @Qualifier("apiSportsWebClient")
    private final WebClient webClient;
    
    private final LeagueConfig leagueConfig;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Get fixtures for a specific date and league
     * API: GET /fixtures?date=YYYY-MM-DD&league=X&season=YYYY
     */
    @Retry(name = "apiSports", fallbackMethod = "getFixturesFallback")
    public Mono<JsonNode> getFixtures(Integer leagueId, Integer season, LocalDate date) {
        String dateStr = date.format(DATE_FORMATTER);
        
        log.info("Fetching fixtures: league={}, season={}, date={}", leagueId, season, dateStr);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/fixtures")
                        .queryParam("league", leagueId)
                        .queryParam("season", season)
                        .queryParam("date", dateStr)
                        .queryParam("timezone", "UTC")
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .doOnSuccess(response -> {
                    if (response != null && response.has("response")) {
                        int count = response.get("response").size();
                        log.info("Successfully fetched {} fixtures for league {} on {}", 
                                count, leagueId, dateStr);
                    }
                })
                .doOnError(error -> 
                    log.error("Error fetching fixtures for league {} on {}: {}", 
                            leagueId, dateStr, error.getMessage())
                );
    }

    /**
     * Get fixtures for date range
     * API: GET /fixtures?league=X&season=YYYY&from=YYYY-MM-DD&to=YYYY-MM-DD
     */
    @Retry(name = "apiSports", fallbackMethod = "getFixturesRangeFallback")
    public Mono<JsonNode> getFixturesRange(Integer leagueId, Integer season, 
                                           LocalDate fromDate, LocalDate toDate) {
        String fromStr = fromDate.format(DATE_FORMATTER);
        String toStr = toDate.format(DATE_FORMATTER);
        
        log.info("Fetching fixtures range: league={}, season={}, from={}, to={}", 
                leagueId, season, fromStr, toStr);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/fixtures")
                        .queryParam("league", leagueId)
                        .queryParam("season", season)
                        .queryParam("from", fromStr)
                        .queryParam("to", toStr)
                        .queryParam("timezone", "UTC")
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .doOnSuccess(response -> {
                    if (response != null && response.has("response")) {
                        int count = response.get("response").size();
                        log.info("Successfully fetched {} fixtures for league {} ({} to {})", 
                                count, leagueId, fromStr, toStr);
                    }
                });
    }

    /**
     * Get live fixtures
     * API: GET /fixtures?live=all
     */
    @Retry(name = "apiSports", fallbackMethod = "getLiveFixturesFallback")
    public Mono<JsonNode> getLiveFixtures() {
        log.info("Fetching live fixtures for all leagues");
        
        // Get live fixtures for our configured leagues only
        String leagueIds = String.join("-", 
                leagueConfig.getAllLeagueIds().stream()
                        .map(String::valueOf)
                        .toList());
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/fixtures")
                        .queryParam("live", leagueIds)
                        .queryParam("timezone", "UTC")
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .doOnSuccess(response -> {
                    if (response != null && response.has("response")) {
                        int count = response.get("response").size();
                        log.info("Successfully fetched {} live fixtures", count);
                    }
                });
    }

    /**
     * Get league information
     * API: GET /leagues?id=X
     */
    @Retry(name = "apiSports", fallbackMethod = "getLeagueFallback")
    public Mono<JsonNode> getLeague(Integer leagueId) {
        log.info("Fetching league info: leagueId={}", leagueId);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/leagues")
                        .queryParam("id", leagueId)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    /**
     * Get team information
     * API: GET /teams?id=X
     */
    @Retry(name = "apiSports", fallbackMethod = "getTeamFallback")
    public Mono<JsonNode> getTeam(Integer teamId) {
        log.info("Fetching team info: teamId={}", teamId);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/teams")
                        .queryParam("id", teamId)
                        .build())
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    // ===== FALLBACK METHODS =====

    private Mono<JsonNode> getFixturesFallback(Integer leagueId, Integer season, 
                                                LocalDate date, Exception ex) {
        log.warn("Fallback triggered for getFixtures: league={}, date={}, error={}", 
                leagueId, date, ex.getMessage());
        return Mono.empty();
    }

    private Mono<JsonNode> getFixturesRangeFallback(Integer leagueId, Integer season,
                                                     LocalDate fromDate, LocalDate toDate, 
                                                     Exception ex) {
        log.warn("Fallback triggered for getFixturesRange: league={}, error={}", 
                leagueId, ex.getMessage());
        return Mono.empty();
    }

    private Mono<JsonNode> getLiveFixturesFallback(Exception ex) {
        log.warn("Fallback triggered for getLiveFixtures: error={}", ex.getMessage());
        return Mono.empty();
    }

    private Mono<JsonNode> getLeagueFallback(Integer leagueId, Exception ex) {
        log.warn("Fallback triggered for getLeague: leagueId={}, error={}", 
                leagueId, ex.getMessage());
        return Mono.empty();
    }

    private Mono<JsonNode> getTeamFallback(Integer teamId, Exception ex) {
        log.warn("Fallback triggered for getTeam: teamId={}, error={}", 
                teamId, ex.getMessage());
        return Mono.empty();
    }
}
