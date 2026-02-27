package com.topplayers.calendar.repository;

import com.topplayers.calendar.entity.Fixture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Fixture Repository
 * Database operations for fixtures
 */
@Repository
public interface FixtureRepository extends JpaRepository<Fixture, Long> {

    /**
     * Find fixture by external ID and sport
     */
    Optional<Fixture> findByExternalIdAndSport(Long externalId, String sport);

    /**
     * Check if fixture exists by external ID and sport
     */
    boolean existsByExternalIdAndSport(Long externalId, String sport);

    /**
     * Get fixtures by date (all leagues)
     */
    @Query(value = "SELECT * FROM fixtures f WHERE " +
           "DATE(f.fixture_date) = :date " +
           "ORDER BY f.fixture_date ASC, f.league_id ASC", nativeQuery = true)
    List<Fixture> findByDate(@Param("date") LocalDate date);

    /**
     * Get fixtures by date for specific league
     */
    @Query(value = "SELECT * FROM fixtures f WHERE " +
           "DATE(f.fixture_date) = :date AND " +
           "f.league_id = :leagueId " +
           "ORDER BY f.fixture_date ASC", nativeQuery = true)
    List<Fixture> findByDateAndLeague(
            @Param("date") LocalDate date,
            @Param("leagueId") Integer leagueId
    );

    /**
     * Get fixtures by date range
     */
    @Query("SELECT f FROM Fixture f WHERE " +
           "f.fixtureDate BETWEEN :startDate AND :endDate " +
           "ORDER BY f.fixtureDate ASC, f.leagueId ASC")
    List<Fixture> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get live fixtures
     */
    @Query("SELECT f FROM Fixture f WHERE " +
           "f.isLive = true " +
           "ORDER BY f.fixtureDate DESC")
    List<Fixture> findLiveFixtures();

    /**
     * Get live fixtures by sport
     */
    @Query(value = "SELECT * FROM fixtures WHERE sport = :sport AND is_live = true ORDER BY fixture_date DESC", nativeQuery = true)
    List<Fixture> findLiveFixturesBySport(@Param("sport") String sport);

    /**
     * Find fixtures by live status and sport
     */
    List<Fixture> findByIsLiveAndSport(Boolean isLive, String sport);

    /**
     * Get today's fixtures
     */
    @Query(value = "SELECT * FROM fixtures f WHERE " +
           "DATE(f.fixture_date) = CURRENT_DATE " +
           "ORDER BY f.fixture_date ASC", nativeQuery = true)
    List<Fixture> findTodaysFixtures();

    /**
     * Get upcoming fixtures (next N days)
     */
    @Query("SELECT f FROM Fixture f WHERE " +
           "f.fixtureDate > :now AND " +
           "f.fixtureDate < :endDate AND " +
           "f.status IN ('NS', 'TBD') " +
           "ORDER BY f.fixtureDate ASC")
    List<Fixture> findUpcomingFixtures(
            @Param("now") LocalDateTime now,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Get fixtures by league and season
     */
    @Query("SELECT f FROM Fixture f WHERE " +
           "f.leagueId = :leagueId AND " +
           "f.season = :season " +
           "ORDER BY f.fixtureDate ASC")
    List<Fixture> findByLeagueAndSeason(
            @Param("leagueId") Integer leagueId,
            @Param("season") Integer season
    );

    /**
     * Get fixtures by team (home or away)
     */
    @Query("SELECT f FROM Fixture f WHERE " +
           "(f.homeTeamId = :teamId OR f.awayTeamId = :teamId) " +
           "ORDER BY f.fixtureDate DESC")
    List<Fixture> findByTeam(@Param("teamId") Integer teamId);

    /**
     * Get top 3 matches for today (by league priority)
     */
    @Query(value = "SELECT * FROM fixtures f WHERE " +
           "DATE(f.fixture_date) = CURRENT_DATE " +
           "ORDER BY f.league_id ASC, f.fixture_date ASC " +
           "LIMIT 3", nativeQuery = true)
    List<Fixture> findTop3TodaysMatches();

    /**
     * Get top 3 matches for specific date
     */
    @Query(value = "SELECT * FROM fixtures f WHERE " +
           "DATE(f.fixture_date) = :date " +
           "ORDER BY f.league_id ASC, f.fixture_date ASC " +
           "LIMIT 3", nativeQuery = true)
    List<Fixture> findTop3MatchesByDate(@Param("date") LocalDate date);

    /**
     * Count fixtures by status
     */
    @Query("SELECT COUNT(f) FROM Fixture f WHERE " +
           "f.status = :status")
    long countByStatus(@Param("status") String status);

    /**
     * Delete old fixtures (cleanup)
     */
    @Query("DELETE FROM Fixture f WHERE " +
           "f.fixtureDate < :cutoffDate AND " +
           "f.status IN ('FT', 'AET', 'PEN', 'CANC')")
    void deleteOldFinishedFixtures(@Param("cutoffDate") LocalDateTime cutoffDate);
}
