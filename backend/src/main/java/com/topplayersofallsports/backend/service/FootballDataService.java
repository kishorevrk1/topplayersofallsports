package com.topplayersofallsports.backend.service;

import com.topplayersofallsports.backend.model.FootballFixture;
import com.topplayersofallsports.backend.repository.FootballFixtureRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Main service for Football data operations
 */
@Service
@Slf4j
@Transactional
public class FootballDataService {

    @Autowired
    private FootballFixtureRepository fixtureRepository;

    @Autowired
    private ApiFootballService apiFootballService;

    @Autowired
    private GeminiAiService geminiAiService;

    // Major leagues we'll focus on (free tier optimization)
    private static final List<MajorLeague> MAJOR_LEAGUES = Arrays.asList(
        new MajorLeague(39, "Premier League", "England"),
        new MajorLeague(140, "La Liga", "Spain"),
        new MajorLeague(135, "Serie A", "Italy"),
        new MajorLeague(78, "Bundesliga", "Germany"),
        new MajorLeague(61, "Ligue 1", "France")
    );

    /**
     * Daily data sync - optimized for 100 API calls/day
     */
    @Scheduled(cron = "0 0 1 * * *") // 1 AM daily
    public void dailyDataSync() {
        log.info("Starting daily football data sync...");
        
        try {
            LocalDate today = LocalDate.now();
            LocalDate nextWeek = today.plusDays(7);
            
            // 1. Sync fixtures for next 7 days (25 API calls - 5 leagues)
            syncFixturesForDateRange(today, nextWeek);
            
            // 2. Process unprocessed fixtures with AI (no API calls)
            processFixturesWithAi();
            
            // 3. Clean up old data
            cleanupOldData();
            
            log.info("Daily football data sync completed successfully");
            
        } catch (Exception e) {
            log.error("Error during daily data sync", e);
        }
    }

    /**
     * Sync fixtures for date range
     */
    private void syncFixturesForDateRange(LocalDate from, LocalDate to) {
        log.info("Syncing fixtures from {} to {}", from, to);
        
        for (MajorLeague league : MAJOR_LEAGUES) {
            try {
                ApiFootballService.ApiFootballResponse<ApiFootballService.FixtureData> response = 
                    apiFootballService.getFixturesByLeagueAndDateRange(league.id, from, to);
                
                if (response != null && response.getResponse() != null) {
                    for (ApiFootballService.FixtureData fixtureData : response.getResponse()) {
                        saveOrUpdateFixture(fixtureData);
                    }
                    log.info("Synced {} fixtures for {}", response.getResponse().size(), league.name);
                } else {
                    log.warn("No fixtures received for league: {}", league.name);
                }
                
                // Small delay to respect rate limits
                Thread.sleep(1000);
                
            } catch (Exception e) {
                log.error("Error syncing fixtures for league: {}", league.name, e);
            }
        }
    }

    /**
     * Save or update fixture from API data
     */
    private void saveOrUpdateFixture(ApiFootballService.FixtureData fixtureData) {
        try {
            Long apiId = fixtureData.getFixture().getId();
            
            FootballFixture fixture = fixtureRepository.findByApiFixtureId(apiId)
                .orElse(new FootballFixture());
            
            // Map API data to entity
            fixture.setApiFixtureId(apiId);
            fixture.setHomeTeam(fixtureData.getTeams().getHome().getName());
            fixture.setAwayTeam(fixtureData.getTeams().getAway().getName());
            fixture.setHomeTeamLogo(fixtureData.getTeams().getHome().getLogo());
            fixture.setAwayTeamLogo(fixtureData.getTeams().getAway().getLogo());
            
            fixture.setLeagueName(fixtureData.getLeague().getName());
            fixture.setLeagueId(fixtureData.getLeague().getId().intValue());
            fixture.setLeagueCountry(fixtureData.getLeague().getCountry());
            fixture.setLeagueLogo(fixtureData.getLeague().getLogo());
            
            // Parse fixture date
            if (fixtureData.getFixture().getDate() != null) {
                fixture.setFixtureDate(
                    LocalDateTime.parse(fixtureData.getFixture().getDate(), 
                        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX"))
                );
            }
            
            if (fixtureData.getFixture().getVenue() != null) {
                fixture.setVenue(fixtureData.getFixture().getVenue().getName());
                fixture.setVenueCity(fixtureData.getFixture().getVenue().getCity());
            }
            
            fixture.setStatus(fixtureData.getFixture().getStatus().getShortStatus());
            fixture.setRound(fixtureData.getLeague().getRound());
            fixture.setSeason(fixtureData.getLeague().getSeason());
            
            // Set scores if available
            if (fixtureData.getGoals() != null) {
                fixture.setHomeScore(fixtureData.getGoals().getHome());
                fixture.setAwayScore(fixtureData.getGoals().getAway());
            }
            
            // Calculate importance score
            fixture.setImportanceScore(
                geminiAiService.calculateImportanceScore(
                    fixture.getLeagueName(), 
                    fixture.getRound(),
                    fixture.getHomeTeam(), 
                    fixture.getAwayTeam()
                )
            );
            
            // Set match type
            if (fixture.getRound() != null) {
                String round = fixture.getRound().toLowerCase();
                if (round.contains("final")) {
                    fixture.setMatchType("final");
                } else if (round.contains("semi")) {
                    fixture.setMatchType("semifinal");
                } else if (round.contains("quarter")) {
                    fixture.setMatchType("quarterfinal");
                } else {
                    fixture.setMatchType("regular");
                }
            } else {
                fixture.setMatchType("regular");
            }
            
            fixture.setCacheDate(LocalDateTime.now());
            fixture.setIsLive("1H".equals(fixture.getStatus()) || "2H".equals(fixture.getStatus()));
            
            fixtureRepository.save(fixture);
            
        } catch (Exception e) {
            log.error("Error saving fixture: {}", fixtureData.getFixture().getId(), e);
        }
    }

    /**
     * Process fixtures with AI enhancement
     */
    @Async
    public void processFixturesWithAi() {
        log.info("Starting AI processing of fixtures...");
        
        try {
            // Get unprocessed fixtures (limit to 20 for AI rate limits)
            List<FootballFixture> unprocessedFixtures = fixtureRepository
                .findFixturesNeedingAiProcessing(PageRequest.of(0, 20));
            
            for (FootballFixture fixture : unprocessedFixtures) {
                enhanceFixtureWithAi(fixture);
                
                // Small delay between AI calls
                Thread.sleep(2000);
            }
            
            log.info("AI processing completed for {} fixtures", unprocessedFixtures.size());
            
        } catch (Exception e) {
            log.error("Error during AI processing", e);
        }
    }

    /**
     * Enhance single fixture with AI
     */
    @Async
    public CompletableFuture<Void> enhanceFixtureWithAi(FootballFixture fixture) {
        try {
            // Generate AI description
            CompletableFuture<String> descriptionFuture = geminiAiService.enhanceFixtureDescription(
                fixture.getHomeTeam(),
                fixture.getAwayTeam(),
                fixture.getLeagueName(),
                fixture.getVenue(),
                fixture.getFixtureDate().toLocalDate().toString()
            );
            
            // Generate AI hashtags
            CompletableFuture<List<String>> hashtagsFuture = geminiAiService.generateMatchHashtags(
                fixture.getHomeTeam(),
                fixture.getAwayTeam(),
                fixture.getLeagueName()
            );
            
            // Wait for both to complete
            CompletableFuture.allOf(descriptionFuture, hashtagsFuture).join();
            
            // Update fixture with AI content
            fixture.setAiDescription(descriptionFuture.get());
            fixture.setHashtagsFromArray(hashtagsFuture.get().toArray(new String[0]));
            fixture.setAiProcessed(true);
            
            fixtureRepository.save(fixture);
            
            log.debug("AI enhancement completed for fixture: {} vs {}", 
                fixture.getHomeTeam(), fixture.getAwayTeam());
            
        } catch (Exception e) {
            log.error("Error enhancing fixture with AI: {}", fixture.getId(), e);
        }
        
        return CompletableFuture.completedFuture(null);
    }

    /**
     * Get fixtures by date range
     */
    public List<FootballFixture> getFixturesByDateRange(LocalDate from, LocalDate to) {
        return fixtureRepository.findFixturesByDateRange(
            from.atStartOfDay(), 
            to.atTime(23, 59, 59)
        );
    }

    /**
     * Get fixtures by date range and league
     */
    public List<FootballFixture> getFixturesByDateRangeAndLeague(
            LocalDate from, LocalDate to, String leagueName) {
        return fixtureRepository.findFixturesByDateRangeAndLeague(
            from.atStartOfDay(), 
            to.atTime(23, 59, 59),
            leagueName
        );
    }

    /**
     * Get today's fixtures
     */
    public List<FootballFixture> getTodaysFixtures() {
        return fixtureRepository.findTodaysFixtures();
    }

    /**
     * Search fixtures
     */
    public List<FootballFixture> searchFixtures(String query) {
        return fixtureRepository.searchFixtures(query);
    }

    /**
     * Clean up old data
     */
    private void cleanupOldData() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            fixtureRepository.deleteOldCachedFixtures(cutoffDate);
            log.info("Cleaned up fixtures older than 30 days");
        } catch (Exception e) {
            log.error("Error cleaning up old data", e);
        }
    }

    /**
     * Get API usage statistics
     */
    public ApiUsageStats getApiUsageStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        
        return ApiUsageStats.builder()
            .footballApiStats(apiFootballService.getApiUsageStats())
            .aiApiStats(geminiAiService.getAiUsageStats())
            .totalCachedFixtures(fixtureRepository.countTodaysCachedFixtures(startOfDay, endOfDay))
            .build();
    }

    // Helper classes
    private static class MajorLeague {
        final Integer id;
        final String name;
        @SuppressWarnings("unused") // Used for documentation/reference
        final String country;
        
        MajorLeague(Integer id, String name, String country) {
            this.id = id;
            this.name = name;
            this.country = country;
        }
    }

    @lombok.Data
    @lombok.Builder
    public static class ApiUsageStats {
        private ApiFootballService.ApiUsageStats footballApiStats;
        private GeminiAiService.AiUsageStats aiApiStats;
        private Long totalCachedFixtures;
    }
}
