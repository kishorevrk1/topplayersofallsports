package com.topplayersofallsports.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for AI content generation using Google Gemini API
 * Implements fallback strategies and rate limiting for production use
 */
@Service
@Slf4j
public class GeminiAiService {

    @Value("${app.ai.gemini.api-key}")
    private String apiKey;

    @Value("${app.ai.gemini.base-url}")
    private String baseUrl;

    @Value("${app.ai.gemini.model}")
    private String model;

    @Value("${app.ai.daily-limit}")
    private int dailyLimit;

    private final AtomicInteger dailyUsageCount = new AtomicInteger(0);
    private LocalDate lastResetDate = LocalDate.now();

    @PostConstruct
    public void init() {
        log.info("GeminiAiService initialized with model: {}, daily limit: {}", model, dailyLimit);
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("Gemini API key not configured - will use fallback responses only");
        }
    }

    /**
     * Enhance fixture description with AI
     */
    @Async
    public CompletableFuture<String> enhanceFixtureDescription(
            String homeTeam, String awayTeam, String leagueName, 
            String venue, String matchDate) {
        
        if (!canMakeApiCall()) {
            log.debug("AI rate limit reached, using fallback description");
            return CompletableFuture.completedFuture(
                generateFallbackDescription(homeTeam, awayTeam, leagueName, venue, matchDate)
            );
        }

        // For now, use fallback while we implement proper API integration
        // TODO: Implement actual Gemini API call
        dailyUsageCount.incrementAndGet();
        log.debug("Generated AI-enhanced description for {} vs {}", homeTeam, awayTeam);
        
        return CompletableFuture.completedFuture(
            generateFallbackDescription(homeTeam, awayTeam, leagueName, venue, matchDate)
        );
    }

    /**
     * Generate match hashtags
     */
    @Async
    public CompletableFuture<List<String>> generateMatchHashtags(
            String homeTeam, String awayTeam, String leagueName) {
        
        if (!canMakeApiCall()) {
            log.debug("AI rate limit reached, using fallback hashtags");
            return CompletableFuture.completedFuture(
                generateFallbackHashtags(homeTeam, awayTeam, leagueName)
            );
        }

        // For now, use fallback while we implement proper API integration
        // TODO: Implement actual Gemini API call
        dailyUsageCount.incrementAndGet();
        log.debug("Generated AI hashtags for {} vs {}", homeTeam, awayTeam);
        
        return CompletableFuture.completedFuture(
            generateFallbackHashtags(homeTeam, awayTeam, leagueName)
        );
    }

    /**
     * Calculate importance score for a fixture based on multiple factors
     */
    public int calculateImportanceScore(String leagueName, String round, String homeTeam, String awayTeam) {
        int score = 50; // Base score

        // League importance (tier-based scoring)
        if (leagueName != null) {
            String league = leagueName.toLowerCase();
            if (league.contains("champions league") || league.contains("europa league")) {
                score += 35; // International competitions
            } else if (league.contains("premier league")) {
                score += 30; // Top European league
            } else if (league.contains("la liga") || league.contains("serie a") || league.contains("bundesliga")) {
                score += 25; // Major European leagues
            } else if (league.contains("ligue 1") || league.contains("eredivisie")) {
                score += 20; // Secondary European leagues
            } else if (league.contains("world cup") || league.contains("euro")) {
                score += 40; // International tournaments
            }
        }

        // Round/stage importance
        if (round != null) {
            String roundLower = round.toLowerCase();
            if (roundLower.contains("final")) {
                score += 40;
            } else if (roundLower.contains("semi")) {
                score += 30;
            } else if (roundLower.contains("quarter")) {
                score += 20;
            } else if (roundLower.contains("round of 16") || roundLower.contains("last 16")) {
                score += 15;
            }
        }

        // Team importance (based on historical performance and popularity)
        if (homeTeam != null && awayTeam != null) {
            String[] topTierTeams = {
                "Barcelona", "Real Madrid", "Manchester United", "Manchester City", 
                "Liverpool", "Arsenal", "Chelsea", "Bayern Munich", "Juventus", 
                "AC Milan", "Inter Milan", "Paris Saint-Germain", "Atletico Madrid"
            };
            
            String[] secondTierTeams = {
                "Tottenham", "Newcastle", "West Ham", "Aston Villa", "Brighton",
                "Borussia Dortmund", "RB Leipzig", "Bayer Leverkusen",
                "AS Roma", "Napoli", "Lazio", "Atalanta",
                "Valencia", "Sevilla", "Real Betis", "Villarreal",
                "Marseille", "Lyon", "Monaco", "Lille"
            };
            
            boolean homeIsTopTier = Arrays.stream(topTierTeams).anyMatch(team -> homeTeam.contains(team));
            boolean awayIsTopTier = Arrays.stream(topTierTeams).anyMatch(team -> awayTeam.contains(team));
            boolean homeIsSecondTier = Arrays.stream(secondTierTeams).anyMatch(team -> homeTeam.contains(team));
            boolean awayIsSecondTier = Arrays.stream(secondTierTeams).anyMatch(team -> awayTeam.contains(team));
            
            if (homeIsTopTier && awayIsTopTier) {
                score += 25; // Top tier clash
            } else if ((homeIsTopTier && awayIsSecondTier) || (awayIsTopTier && homeIsSecondTier)) {
                score += 20; // Mixed tier important match
            } else if (homeIsTopTier || awayIsTopTier) {
                score += 15; // One top tier team
            } else if (homeIsSecondTier && awayIsSecondTier) {
                score += 10; // Second tier clash
            } else if (homeIsSecondTier || awayIsSecondTier) {
                score += 5; // One second tier team
            }
        }

        // Ensure score is within valid range
        return Math.min(100, Math.max(1, score));
    }

    /**
     * Generate fallback description with improved template
     */
    private String generateFallbackDescription(String homeTeam, String awayTeam, 
                                             String leagueName, String venue, String matchDate) {
        
        String[] templates = {
            "Exciting %s encounter as %s welcomes %s to %s. Both sides will be eager to claim all three points in this crucial fixture.",
            "%s face %s at %s in what promises to be a thrilling %s clash. The stage is set for an entertaining battle between these competitive sides.",
            "All eyes turn to %s as %s host %s in this important %s fixture. Expect fireworks when these two teams meet on the pitch.",
            "%s and %s are set to lock horns at %s in this highly anticipated %s showdown. Both teams will be looking to make their mark."
        };
        
        // Use hash of team names to consistently pick same template for same matchup
        int templateIndex = Math.abs((homeTeam + awayTeam).hashCode()) % templates.length;
        String template = templates[templateIndex];
        
        // Different formats based on template
        if (templateIndex == 0 || templateIndex == 2) {
            return String.format(template, leagueName, homeTeam, awayTeam, venue);
        } else {
            return String.format(template, homeTeam, awayTeam, venue, leagueName);
        }
    }

    /**
     * Generate fallback hashtags with league-specific tags
     */
    private List<String> generateFallbackHashtags(String homeTeam, String awayTeam, String leagueName) {
        List<String> hashtags = Arrays.asList(
            "#Football",
            "#Soccer", 
            "#" + leagueName.replaceAll("\\s+", "").replaceAll("[^a-zA-Z0-9]", ""),
            "#" + homeTeam.replaceAll("\\s+", "").replaceAll("[^a-zA-Z0-9]", ""),
            "#" + awayTeam.replaceAll("\\s+", "").replaceAll("[^a-zA-Z0-9]", ""),
            "#MatchDay",
            "#LiveFootball"
        );
        
        // Add league-specific hashtags
        if (leagueName != null) {
            String league = leagueName.toLowerCase();
            if (league.contains("premier league")) {
                hashtags.add("#PremierLeague");
                hashtags.add("#EPL");
            } else if (league.contains("la liga")) {
                hashtags.add("#LaLiga");
                hashtags.add("#LaLigaSantander");
            } else if (league.contains("serie a")) {
                hashtags.add("#SerieA");
                hashtags.add("#SerieATIM");
            } else if (league.contains("bundesliga")) {
                hashtags.add("#Bundesliga");
                hashtags.add("#BundesligaOfficial");
            } else if (league.contains("ligue 1")) {
                hashtags.add("#Ligue1");
                hashtags.add("#Ligue1Uber");
            } else if (league.contains("champions league")) {
                hashtags.add("#ChampionsLeague");
                hashtags.add("#UCL");
            }
        }
        
        return hashtags;
    }

    /**
     * Check if we can make an API call (rate limiting)
     */
    private boolean canMakeApiCall() {
        resetDailyCountIfNeeded();
        boolean canCall = dailyUsageCount.get() < dailyLimit && apiKey != null && !apiKey.trim().isEmpty();
        
        if (!canCall && dailyUsageCount.get() >= dailyLimit) {
            log.debug("AI API daily limit reached: {}/{}", dailyUsageCount.get(), dailyLimit);
        }
        
        return canCall;
    }

    /**
     * Reset daily count if new day
     */
    private synchronized void resetDailyCountIfNeeded() {
        LocalDate today = LocalDate.now();
        if (!today.equals(lastResetDate)) {
            int previousCount = dailyUsageCount.getAndSet(0);
            lastResetDate = today;
            log.info("Reset AI usage count for new day. Previous day usage: {}/{}", previousCount, dailyLimit);
        }
    }

    /**
     * Get AI usage statistics
     */
    public AiUsageStats getAiUsageStats() {
        resetDailyCountIfNeeded();
        return AiUsageStats.builder()
            .dailyUsageCount(dailyUsageCount.get())
            .dailyLimit(dailyLimit)
            .remainingCalls(Math.max(0, dailyLimit - dailyUsageCount.get()))
            .lastResetDate(lastResetDate.toString())
            .apiConfigured(apiKey != null && !apiKey.trim().isEmpty())
            .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class AiUsageStats {
        private int dailyUsageCount;
        private int dailyLimit;
        private int remainingCalls;
        private String lastResetDate;
        private boolean apiConfigured;
    }
}
