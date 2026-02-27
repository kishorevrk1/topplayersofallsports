package com.topplayers.calendar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.topplayers.calendar.client.BasketballApiClient;
import com.topplayers.calendar.entity.Fixture;
import com.topplayers.calendar.repository.FixtureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Basketball Service
 * Handles basketball game data from API-Sports Basketball
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BasketballService {

    private final BasketballApiClient basketballApiClient;
    private final FixtureRepository fixtureRepository;

    /**
     * Update live basketball games
     */
    @Transactional
    public void updateLiveGames() {
        log.info("Updating live basketball games");
        
        basketballApiClient.getLiveGames()
                .subscribe(
                        response -> {
                            // Get current live game IDs from API
                            Set<Long> currentLiveIds = new HashSet<>();
                            if (response != null && response.has("response")) {
                                for (JsonNode gameNode : response.get("response")) {
                                    if (gameNode.has("id")) {
                                        currentLiveIds.add(gameNode.get("id").asLong());
                                    }
                                }
                            }
                            
                            // Mark previously live games as not live if they're not in current response
                            List<Fixture> previouslyLive = fixtureRepository.findByIsLiveAndSport(true, "basketball");
                            for (Fixture fixture : previouslyLive) {
                                if (!currentLiveIds.contains(fixture.getExternalId())) {
                                    fixture.setIsLive(false);
                                    fixture.setUpdatedAt(LocalDateTime.now());
                                    fixtureRepository.save(fixture);
                                    log.info("Marked basketball game {} as finished", fixture.getExternalId());
                                }
                            }
                            
                            // Process current live games
                            processAndSaveGames(response);
                        },
                        error -> log.error("Error updating live basketball games: {}", error.getMessage())
                );
    }

    /**
     * Process and save basketball games from API response
     */
    private void processAndSaveGames(JsonNode response) {
        if (response == null || !response.has("response")) {
            log.warn("No basketball games in response");
            return;
        }

        JsonNode gamesArray = response.get("response");
        int savedCount = 0;

        for (JsonNode gameNode : gamesArray) {
            try {
                Fixture fixture = parseBasketballGame(gameNode);
                
                if (fixture != null) {
                    Optional<Fixture> existing = fixtureRepository.findByExternalIdAndSport(
                            fixture.getExternalId(),
                            "basketball"
                    );
                    
                    if (existing.isPresent()) {
                        // Update existing
                        Fixture existingFixture = existing.get();
                        updateFixtureFromNew(existingFixture, fixture);
                        fixtureRepository.save(existingFixture);
                    } else {
                        // Save new
                        fixtureRepository.save(fixture);
                        savedCount++;
                    }
                }
            } catch (Exception e) {
                log.error("Error processing basketball game: {}", e.getMessage());
            }
        }

        log.info("Processed {} live basketball games, saved {} new", gamesArray.size(), savedCount);
    }

    /**
     * Parse basketball game from API JSON
     */
    private Fixture parseBasketballGame(JsonNode gameNode) {
        try {
            JsonNode league = gameNode.get("league");
            JsonNode teams = gameNode.get("teams");
            JsonNode scores = gameNode.get("scores");
            JsonNode status = gameNode.get("status");

            Long externalId = gameNode.get("id").asLong();
            String dateStr = gameNode.get("date").asText();
            LocalDateTime gameDate = LocalDateTime.parse(dateStr.substring(0, 19));

            // Determine if live
            String statusShort = status.get("short").asText();
            boolean isLive = !statusShort.equals("NS") && !statusShort.equals("FT") && !statusShort.equals("AOT");

            return Fixture.builder()
                    .externalId(externalId)
                    .sport("basketball")
                    .leagueId(league.get("id").asInt())
                    .leagueName(league.get("name").asText())
                    .leagueCountry(league.has("country") ? league.get("country").asText() : null)
                    .leagueLogo(league.has("logo") ? league.get("logo").asText() : null)
                    .season(league.has("season") ? league.get("season").asText() : "2024-2025")
                    .round(gameNode.has("week") ? "Week " + gameNode.get("week").asText() : null)
                    .fixtureDate(gameDate)
                    .timezone("UTC")
                    .venue(gameNode.has("venue") ? gameNode.get("venue").asText() : null)
                    .venueCity(gameNode.has("city") ? gameNode.get("city").asText() : null)
                    .homeTeamId(teams.get("home").get("id").asInt())
                    .homeTeamName(teams.get("home").get("name").asText())
                    .homeTeamLogo(teams.get("home").has("logo") ? teams.get("home").get("logo").asText() : null)
                    .awayTeamId(teams.get("away").get("id").asInt())
                    .awayTeamName(teams.get("away").get("name").asText())
                    .awayTeamLogo(teams.get("away").has("logo") ? teams.get("away").get("logo").asText() : null)
                    .status(statusShort)
                    .statusLong(status.get("long").asText())
                    .elapsedTime(null) // Basketball doesn't have elapsed time like football
                    .isLive(isLive)
                    .homeScore(scores.has("home") && scores.get("home").has("total") 
                            ? scores.get("home").get("total").asInt() : null)
                    .awayScore(scores.has("away") && scores.get("away").has("total") 
                            ? scores.get("away").get("total").asInt() : null)
                    .scoreDetails(scores.toString())
                    .referee(null) // Basketball API doesn't provide referee
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error parsing basketball game: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Update existing fixture with new data
     */
    private void updateFixtureFromNew(Fixture existing, Fixture newFixture) {
        existing.setStatus(newFixture.getStatus());
        existing.setStatusLong(newFixture.getStatusLong());
        existing.setIsLive(newFixture.getIsLive());
        existing.setHomeScore(newFixture.getHomeScore());
        existing.setAwayScore(newFixture.getAwayScore());
        existing.setScoreDetails(newFixture.getScoreDetails());
        existing.setUpdatedAt(LocalDateTime.now());
    }
}
