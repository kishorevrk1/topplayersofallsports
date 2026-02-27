package com.topplayers.calendar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.topplayers.calendar.client.ApiSportsClient;
import com.topplayers.calendar.config.LeagueConfig;
import com.topplayers.calendar.dto.FixtureDTO;
import com.topplayers.calendar.entity.Fixture;
import com.topplayers.calendar.repository.FixtureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Fixture Service
 * Core business logic for managing football fixtures
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FixtureService {

    private final FixtureRepository fixtureRepository;
    private final ApiSportsClient apiSportsClient;
    private final LeagueConfig leagueConfig;

    /**
     * Get fixtures for a specific date (all leagues)
     * Returns top 3 matches by default
     */
    @Cacheable(value = "fixtures", key = "'date:' + #date")
    @Transactional(readOnly = true)
    public List<FixtureDTO> getFixturesByDate(LocalDate date) {
        log.info("Getting fixtures for date: {}", date);
        
        List<Fixture> fixtures = fixtureRepository.findByDate(date);
        
        if (fixtures.isEmpty()) {
            log.info("No fixtures found in DB for {}, fetching from API", date);
            syncFixturesForDate(date);
            fixtures = fixtureRepository.findByDate(date);
        }
        
        return fixtures.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get top 3 matches for today
     */
    @Cacheable(value = "top-matches", key = "'today'")
    @Transactional(readOnly = true)
    public List<FixtureDTO> getTop3TodaysMatches() {
        log.info("Getting top 3 matches for today");
        
        List<Fixture> fixtures = fixtureRepository.findTop3TodaysMatches();
        
        if (fixtures.isEmpty()) {
            log.info("No fixtures found for today, syncing...");
            syncFixturesForDate(LocalDate.now());
            fixtures = fixtureRepository.findTop3TodaysMatches();
        }
        
        return fixtures.stream()
                .limit(3)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get top 3 matches for a specific date
     */
    @Cacheable(value = "top-matches", key = "'date:' + #date")
    @Transactional(readOnly = true)
    public List<FixtureDTO> getTop3MatchesByDate(LocalDate date) {
        log.info("Getting top 3 matches for date: {}", date);
        
        List<Fixture> fixtures = fixtureRepository.findTop3MatchesByDate(date);
        
        if (fixtures.isEmpty()) {
            syncFixturesForDate(date);
            fixtures = fixtureRepository.findTop3MatchesByDate(date);
        }
        
        return fixtures.stream()
                .limit(3)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get live fixtures
     */
    @Cacheable(value = "live-fixtures", unless = "#result.isEmpty()")
    @Transactional(readOnly = true)
    public List<FixtureDTO> getLiveFixtures() {
        log.info("Getting live fixtures");
        
        List<Fixture> fixtures = fixtureRepository.findLiveFixtures();
        
        return fixtures.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get fixtures by date range
     */
    @Transactional(readOnly = true)
    public List<FixtureDTO> getFixturesByDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Getting fixtures from {} to {}", startDate, endDate);
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
        
        List<Fixture> fixtures = fixtureRepository.findByDateRange(startDateTime, endDateTime);
        
        return fixtures.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Sync fixtures for a specific date from API-Sports.io
     */
    @Transactional
    public void syncFixturesForDate(LocalDate date) {
        log.info("Syncing fixtures for date: {}", date);
        
        // Fetch fixtures for all configured leagues
        for (LeagueConfig.League league : leagueConfig.getLeagues()) {
            try {
                log.info("Fetching fixtures for league: {} ({})", league.getName(), league.getId());
                
                JsonNode response = apiSportsClient.getFixtures(
                        league.getId(),
                        league.getSeason(),
                        date
                ).block();
                
                if (response != null && response.has("response")) {
                    JsonNode fixturesArray = response.get("response");
                    processAndSaveFixtures(fixturesArray);
                }
                
                // Small delay to respect rate limits
                Thread.sleep(100);
                
            } catch (Exception e) {
                log.error("Error syncing fixtures for league {}: {}", 
                        league.getName(), e.getMessage());
            }
        }
    }

    /**
     * Sync fixtures for date range
     */
    @Transactional
    public void syncFixturesForDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Syncing fixtures from {} to {}", startDate, endDate);
        
        for (LeagueConfig.League league : leagueConfig.getLeagues()) {
            try {
                log.info("Fetching fixtures range for league: {}", league.getName());
                
                JsonNode response = apiSportsClient.getFixturesRange(
                        league.getId(),
                        league.getSeason(),
                        startDate,
                        endDate
                ).block();
                
                if (response != null && response.has("response")) {
                    JsonNode fixturesArray = response.get("response");
                    processAndSaveFixtures(fixturesArray);
                }
                
                Thread.sleep(200);
                
            } catch (Exception e) {
                log.error("Error syncing fixtures range for league {}: {}", 
                        league.getName(), e.getMessage());
            }
        }
    }

    /**
     * Update live fixtures
     */
    @Transactional
    public void updateLiveFixtures() {
        log.info("Updating live fixtures");
        
        try {
            JsonNode response = apiSportsClient.getLiveFixtures().block();
            
            if (response != null && response.has("response")) {
                JsonNode fixturesArray = response.get("response");
                
                // Get current live fixture IDs from API
                Set<Long> currentLiveIds = new HashSet<>();
                for (JsonNode fixtureNode : fixturesArray) {
                    if (fixtureNode.has("fixture") && fixtureNode.get("fixture").has("id")) {
                        currentLiveIds.add(fixtureNode.get("fixture").get("id").asLong());
                    }
                }
                
                // Mark previously live fixtures as not live if they're not in current response
                List<Fixture> previouslyLive = fixtureRepository.findByIsLiveAndSport(true, "football");
                for (Fixture fixture : previouslyLive) {
                    if (!currentLiveIds.contains(fixture.getExternalId())) {
                        fixture.setIsLive(false);
                        fixture.setUpdatedAt(LocalDateTime.now());
                        fixtureRepository.save(fixture);
                        log.info("Marked fixture {} as finished", fixture.getExternalId());
                    }
                }
                
                // Process and save current live fixtures
                processAndSaveFixtures(fixturesArray);
                log.info("Updated {} live fixtures", fixturesArray.size());
            }
        } catch (Exception e) {
            log.error("Error updating live fixtures: {}", e.getMessage());
        }
    }

    /**
     * Process and save fixtures from API response
     */
    private void processAndSaveFixtures(JsonNode fixturesArray) {
        for (JsonNode fixtureNode : fixturesArray) {
            try {
                Fixture fixture = parseFixtureFromJson(fixtureNode);
                
                if (fixture != null) {
                    Optional<Fixture> existing = fixtureRepository.findByExternalIdAndSport(
                            fixture.getExternalId(), 
                            fixture.getSport()
                    );
                    
                    if (existing.isPresent()) {
                        // Update existing fixture
                        Fixture existingFixture = existing.get();
                        updateFixtureFromNew(existingFixture, fixture);
                        fixtureRepository.save(existingFixture);
                        log.debug("Updated fixture: {}", fixture.getExternalId());
                    } else {
                        // Save new fixture
                        fixtureRepository.save(fixture);
                        log.debug("Saved new fixture: {}", fixture.getExternalId());
                    }
                }
            } catch (Exception e) {
                log.error("Error processing fixture: {}", e.getMessage());
            }
        }
    }

    /**
     * Parse fixture from JSON response
     */
    private Fixture parseFixtureFromJson(JsonNode fixtureNode) {
        try {
            JsonNode fixture = fixtureNode.get("fixture");
            JsonNode league = fixtureNode.get("league");
            JsonNode teams = fixtureNode.get("teams");
            JsonNode goals = fixtureNode.get("goals");
            JsonNode score = fixtureNode.get("score");
            
            Long externalId = fixture.get("id").asLong();
            String dateStr = fixture.get("date").asText();
            LocalDateTime fixtureDate = LocalDateTime.parse(dateStr.substring(0, 19));
            
            return Fixture.builder()
                    .externalId(externalId)
                    .sport("football") // Currently handling football only
                    .leagueId(league.get("id").asInt())
                    .leagueName(league.get("name").asText())
                    .leagueCountry(league.get("country").asText())
                    .leagueLogo(league.has("logo") ? league.get("logo").asText() : null)
                    .season(String.valueOf(league.get("season").asInt()))
                    .round(league.get("round").asText(""))
                    .fixtureDate(fixtureDate)
                    .timezone(fixture.get("timezone").asText("UTC"))
                    .venue(fixture.has("venue") && fixture.get("venue").has("name") ? 
                            fixture.get("venue").get("name").asText() : null)
                    .venueCity(fixture.has("venue") && fixture.get("venue").has("city") ? 
                            fixture.get("venue").get("city").asText() : null)
                    .homeTeamId(teams.get("home").get("id").asInt())
                    .homeTeamName(teams.get("home").get("name").asText())
                    .homeTeamLogo(teams.get("home").get("logo").asText(""))
                    .awayTeamId(teams.get("away").get("id").asInt())
                    .awayTeamName(teams.get("away").get("name").asText())
                    .awayTeamLogo(teams.get("away").get("logo").asText(""))
                    .status(fixture.get("status").get("short").asText())
                    .statusLong(fixture.get("status").get("long").asText())
                    .elapsedTime(fixture.get("status").has("elapsed") ? 
                            fixture.get("status").get("elapsed").asInt() : null)
                    .isLive("1H".equals(fixture.get("status").get("short").asText()) || 
                           "2H".equals(fixture.get("status").get("short").asText()) ||
                           "HT".equals(fixture.get("status").get("short").asText()))
                    .homeScore(goals.has("home") && !goals.get("home").isNull() ? 
                            goals.get("home").asInt() : null)
                    .awayScore(goals.has("away") && !goals.get("away").isNull() ? 
                            goals.get("away").asInt() : null)
                    .scoreDetails(score != null ? score.toString() : null)
                    .referee(fixture.has("referee") ? fixture.get("referee").asText() : null)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error parsing fixture JSON: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Update existing fixture with new data
     */
    private void updateFixtureFromNew(Fixture existing, Fixture newFixture) {
        existing.setStatus(newFixture.getStatus());
        existing.setStatusLong(newFixture.getStatusLong());
        existing.setElapsedTime(newFixture.getElapsedTime());
        existing.setIsLive(newFixture.getIsLive());
        existing.setHomeScore(newFixture.getHomeScore());
        existing.setAwayScore(newFixture.getAwayScore());
        existing.setScoreDetails(newFixture.getScoreDetails());
    }

    /**
     * Map Fixture entity to DTO
     */
    private FixtureDTO mapToDTO(Fixture fixture) {
        return FixtureDTO.builder()
                .id(fixture.getId())
                .externalId(fixture.getExternalId())
                .sport(fixture.getSport())
                .league(FixtureDTO.LeagueInfo.builder()
                        .id(fixture.getLeagueId())
                        .name(fixture.getLeagueName())
                        .country(fixture.getLeagueCountry())
                        .logo(fixture.getLeagueLogo())
                        .build())
                .fixtureDate(fixture.getFixtureDate())
                .timezone(fixture.getTimezone())
                .venue(FixtureDTO.VenueInfo.builder()
                        .name(fixture.getVenue())
                        .city(fixture.getVenueCity())
                        .build())
                .homeTeam(FixtureDTO.TeamInfo.builder()
                        .id(fixture.getHomeTeamId())
                        .name(fixture.getHomeTeamName())
                        .logo(fixture.getHomeTeamLogo())
                        .build())
                .awayTeam(FixtureDTO.TeamInfo.builder()
                        .id(fixture.getAwayTeamId())
                        .name(fixture.getAwayTeamName())
                        .logo(fixture.getAwayTeamLogo())
                        .build())
                .status(fixture.getStatus())
                .statusLong(fixture.getStatusLong())
                .elapsedTime(fixture.getElapsedTime())
                .isLive(fixture.getIsLive())
                .homeScore(fixture.getHomeScore())
                .awayScore(fixture.getAwayScore())
                .scoreDetails(fixture.getScoreDetails())
                .referee(fixture.getReferee())
                .season(fixture.getSeason())
                .round(fixture.getRound())
                .build();
    }
    
    /**
     * Get recent finished matches (last N days)
     */
    @Cacheable(value = "recentMatches", key = "#sport + '_' + #days")
    public List<FixtureDTO> getRecentFinishedMatches(String sport, int days) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(days);
        
        List<Fixture> recentMatches = fixtureRepository.findAll().stream()
                .filter(f -> f.getIsLive() != null && !f.getIsLive())
                .filter(f -> f.getUpdatedAt() != null && f.getUpdatedAt().isAfter(cutoffDate))
                .filter(f -> f.getStatus() != null && 
                        (f.getStatus().equals("FT") || f.getStatus().equals("AET") || f.getStatus().equals("PEN")))
                .filter(f -> sport == null || sport.equals("all") || f.getSport().equals(sport))
                .sorted((a, b) -> b.getFixtureDate().compareTo(a.getFixtureDate()))
                .limit(50)
                .toList();
        
        return recentMatches.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get matches for a specific date
     */
    @Cacheable(value = "matchesByDate", key = "#sport + '_' + #date")
    public List<FixtureDTO> getMatchesByDate(String sport, LocalDate date) {
        List<Fixture> matches = fixtureRepository.findByDate(date);
        
        return matches.stream()
                .filter(f -> sport == null || sport.equals("all") || f.getSport().equals(sport))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }
}
