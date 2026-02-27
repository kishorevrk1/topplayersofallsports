package com.topplayers.calendar.client;

import com.fasterxml.jackson.databind.JsonNode;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Basketball API Client
 * Handles calls to API-Sports Basketball API (v1.basketball.api-sports.io)
 */
@Component
@Slf4j
public class BasketballApiClient {

    private final WebClient webClient;
    
    @Value("${api-sports.api-key}")
    private String apiKey;

    public BasketballApiClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://v1.basketball.api-sports.io")
                .build();
    }

    /**
     * Get live basketball games
     * Basketball API uses /games endpoint with live=all for live matches
     */
    @Retry(name = "apiSports")
    public Mono<JsonNode> getLiveGames() {
        log.info("Fetching live basketball games");
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/games")
                        .queryParam("live", "all")
                        .queryParam("timezone", "UTC")
                        .build())
                .header("x-apisports-key", apiKey)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .doOnSuccess(response -> {
                    if (response != null && response.has("response")) {
                        int count = response.get("response").size();
                        log.info("Successfully fetched {} live basketball games", count);
                    }
                })
                .doOnError(error -> 
                    log.error("Error fetching live basketball games: {}", error.getMessage())
                );
    }

    /**
     * Get games for specific league and date
     */
    @Retry(name = "apiSports")
    public Mono<JsonNode> getGamesByLeagueAndDate(Integer leagueId, String season, String date) {
        log.info("Fetching basketball games: league={}, season={}, date={}", leagueId, season, date);
        
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/games")
                        .queryParam("league", leagueId)
                        .queryParam("season", season)
                        .queryParam("date", date)
                        .queryParam("timezone", "UTC")
                        .build())
                .header("x-apisports-key", apiKey)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .doOnSuccess(response -> {
                    if (response != null && response.has("response")) {
                        int count = response.get("response").size();
                        log.info("Successfully fetched {} basketball games", count);
                    }
                })
                .doOnError(error -> 
                    log.error("Error fetching basketball games: {}", error.getMessage())
                );
    }
}
