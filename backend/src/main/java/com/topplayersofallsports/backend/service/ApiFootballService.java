package com.topplayersofallsports.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for interacting with API-Football
 * Implements rate limiting and proper error handling for production use
 */
@Service
@Slf4j
public class ApiFootballService {

    @Value("${app.sports.api-football.api-key}")
    private String apiKey;

    @Value("${app.sports.api-football.base-url}")
    private String baseUrl;

    @Value("${app.sports.api-football.host}")
    private String apiHost;

    @Value("${app.sports.api-football.daily-limit}")
    private Integer dailyRateLimit;

    private final RestTemplate restTemplate;
    private final AtomicInteger dailyRequestCount = new AtomicInteger(0);
    private LocalDate lastResetDate = LocalDate.now();

    public ApiFootballService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    public void init() {
        log.info("ApiFootballService initialized with daily limit: {}", dailyRateLimit);
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.error("API-Football API key not configured!");
        } else {
            log.info("API-Football service ready with host: {}", apiHost);
        }
    }

    /**
     * Create headers for API-Football requests with proper authentication
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-RapidAPI-Host", apiHost);
        headers.set("X-RapidAPI-Key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    /**
     * Check if we can make an API call (rate limiting)
     */
    private boolean canMakeApiCall() {
        resetDailyCountIfNeeded();
        boolean canCall = dailyRequestCount.get() < dailyRateLimit && apiKey != null && !apiKey.trim().isEmpty();
        
        if (!canCall && dailyRequestCount.get() >= dailyRateLimit) {
            log.warn("API-Football daily rate limit reached: {}/{}", dailyRequestCount.get(), dailyRateLimit);
        }
        
        return canCall;
    }

    /**
     * Reset daily count if new day
     */
    private synchronized void resetDailyCountIfNeeded() {
        LocalDate today = LocalDate.now();
        if (!today.equals(lastResetDate)) {
            int previousCount = dailyRequestCount.getAndSet(0);
            lastResetDate = today;
            log.info("Reset API-Football usage count for new day. Previous day usage: {}/{}", previousCount, dailyRateLimit);
        }
    }

    /**
     * Get fixtures by date range
     */
    public ApiFootballResponse<FixtureData> getFixturesByDateRange(LocalDate from, LocalDate to) {
        if (!canMakeApiCall()) {
            log.warn("Cannot make API call - rate limit or configuration issue");
            return new ApiFootballResponse<>();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/fixtures")
                .queryParam("from", from.toString())
                .queryParam("to", to.toString())
                .build()
                .toUriString();

            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            
            ParameterizedTypeReference<ApiFootballResponse<FixtureData>> responseType = 
                new ParameterizedTypeReference<ApiFootballResponse<FixtureData>>() {};
            
            ResponseEntity<ApiFootballResponse<FixtureData>> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, responseType
            );

            dailyRequestCount.incrementAndGet();
            log.info("API call successful. Daily count: {}/{}", dailyRequestCount.get(), dailyRateLimit);

            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error fetching fixtures from API-Football: {}", e.getMessage());
            return new ApiFootballResponse<>();
        } catch (Exception e) {
            log.error("Unexpected error fetching fixtures from API-Football", e);
            return new ApiFootballResponse<>();
        }
    }

    /**
     * Get fixtures by league and date range
     */
    public ApiFootballResponse<FixtureData> getFixturesByLeagueAndDateRange(
            Integer leagueId, LocalDate from, LocalDate to) {
        
        if (!canMakeApiCall()) {
            log.warn("Cannot make API call for league {} - rate limit or configuration issue", leagueId);
            return new ApiFootballResponse<>();
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/fixtures")
                .queryParam("league", leagueId)
                .queryParam("from", from.toString())
                .queryParam("to", to.toString())
                .build()
                .toUriString();

            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            
            ParameterizedTypeReference<ApiFootballResponse<FixtureData>> responseType = 
                new ParameterizedTypeReference<ApiFootballResponse<FixtureData>>() {};
            
            ResponseEntity<ApiFootballResponse<FixtureData>> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, responseType
            );

            dailyRequestCount.incrementAndGet();
            log.info("API call successful for league {}. Daily count: {}/{}", 
                leagueId, dailyRequestCount.get(), dailyRateLimit);

            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error fetching fixtures for league {} from API-Football: {}", leagueId, e.getMessage());
            return new ApiFootballResponse<>();
        } catch (Exception e) {
            log.error("Unexpected error fetching fixtures for league {} from API-Football", leagueId, e);
            return new ApiFootballResponse<>();
        }
    }

    /**
     * Get live fixtures
     */
    public ApiFootballResponse<FixtureData> getLiveFixtures() {
        if (!canMakeApiCall()) {
            log.warn("Cannot make API call for live fixtures - rate limit or configuration issue");
            return new ApiFootballResponse<>();
        }

        try {
            String url = baseUrl + "/fixtures?live=all";
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());
            
            ParameterizedTypeReference<ApiFootballResponse<FixtureData>> responseType = 
                new ParameterizedTypeReference<ApiFootballResponse<FixtureData>>() {};
            
            ResponseEntity<ApiFootballResponse<FixtureData>> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, responseType
            );

            dailyRequestCount.incrementAndGet();
            log.info("Live fixtures API call successful. Daily count: {}/{}", 
                dailyRequestCount.get(), dailyRateLimit);

            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error fetching live fixtures from API-Football: {}", e.getMessage());
            return new ApiFootballResponse<>();
        } catch (Exception e) {
            log.error("Unexpected error fetching live fixtures from API-Football", e);
            return new ApiFootballResponse<>();
        }
    }

    /**
     * Get current API usage statistics
     */
    public ApiUsageStats getApiUsageStats() {
        return ApiUsageStats.builder()
            .dailyLimit(dailyRateLimit)
            .currentUsage(dailyRequestCount.get())
            .remainingCalls(dailyRateLimit - dailyRequestCount.get())
            .usagePercentage((dailyRequestCount.get() * 100.0) / dailyRateLimit)
            .build();
    }

    /**
     * Reset daily counter (called by scheduler)
     */
    public void resetDailyCounter() {
        int previousCount = dailyRequestCount.getAndSet(0);
        log.info("Daily API counter reset. Previous count: {}", previousCount);
    }

    // DTO Classes for API responses
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ApiFootballResponse<T> {
        private String get;
        private Parameters parameters;
        private List<String> errors;
        private Integer results;
        private Paging paging;
        private List<T> response;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Parameters {
            private String from;
            private String to;
            private String league;
            private String live;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class Paging {
            private Integer current;
            private Integer total;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class FixtureData {
        private FixtureInfo fixture;
        private LeagueInfo league;
        private TeamsInfo teams;
        private GoalsInfo goals;
        private ScoreInfo score;

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class FixtureInfo {
            private Long id;
            private String referee;
            private String timezone;
            private String date;
            private Long timestamp;
            private PeriodsInfo periods;
            private VenueInfo venue;
            private StatusInfo status;

            @Data
            @JsonIgnoreProperties(ignoreUnknown = true)
            public static class PeriodsInfo {
                private Integer first;
                private Integer second;
            }

            @Data
            @JsonIgnoreProperties(ignoreUnknown = true)
            public static class VenueInfo {
                private Long id;
                private String name;
                private String city;
            }

            @Data
            @JsonIgnoreProperties(ignoreUnknown = true)
            public static class StatusInfo {
                @JsonProperty("long")
                private String longStatus;
                @JsonProperty("short")
                private String shortStatus;
                private Integer elapsed;
            }
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class LeagueInfo {
            private Long id;
            private String name;
            private String country;
            private String logo;
            private String flag;
            private String season;
            private String round;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class TeamsInfo {
            private TeamInfo home;
            private TeamInfo away;

            @Data
            @JsonIgnoreProperties(ignoreUnknown = true)
            public static class TeamInfo {
                private Long id;
                private String name;
                private String logo;
                private Boolean winner;
            }
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class GoalsInfo {
            private Integer home;
            private Integer away;
        }

        @Data
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class ScoreInfo {
            private GoalsInfo halftime;
            private GoalsInfo fulltime;
            private GoalsInfo extratime;
            private GoalsInfo penalty;
        }
    }

    @Data
    @lombok.Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ApiUsageStats {
        private Integer dailyLimit;
        private Integer currentUsage;
        private Integer remainingCalls;
        private Double usagePercentage;
    }
}
