package com.topplayers.calendar.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * League Configuration
 * Defines the top 4 football leagues to track
 */
@Configuration
@ConfigurationProperties(prefix = "api-sports")
@Data
public class LeagueConfig {
    
    private String baseUrl;
    private String apiKey;
    private RateLimit rateLimit;
    private List<League> leagues = new ArrayList<>();
    
    @Data
    public static class RateLimit {
        private int requestsPerDay;
        private int requestsPerMinute;
    }
    
    @Data
    public static class League {
        private int id;
        private String name;
        private String country;
        private int season;
        private int priority;
        
        public boolean isWorldCup() {
            return id == 1;
        }
        
        public boolean isChampionsLeague() {
            return id == 2;
        }
        
        public boolean isPremierLeague() {
            return id == 39;
        }
        
        public boolean isLaLiga() {
            return id == 140;
        }
    }
    
    /**
     * Get league by ID
     */
    public League getLeagueById(int id) {
        return leagues.stream()
                .filter(league -> league.getId() == id)
                .findFirst()
                .orElse(null);
    }
    
    /**
     * Get all league IDs
     */
    public List<Integer> getAllLeagueIds() {
        return leagues.stream()
                .map(League::getId)
                .toList();
    }
    
    /**
     * Get leagues sorted by priority
     */
    public List<League> getLeaguesByPriority() {
        return leagues.stream()
                .sorted((a, b) -> Integer.compare(a.getPriority(), b.getPriority()))
                .toList();
    }
}
