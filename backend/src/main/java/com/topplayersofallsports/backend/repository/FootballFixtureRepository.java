package com.topplayersofallsports.backend.repository;

import com.topplayersofallsports.backend.model.FootballFixture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for FootballFixture entities
 */
@Repository
public interface FootballFixtureRepository extends JpaRepository<FootballFixture, Long> {

    /**
     * Find fixture by API ID
     */
    Optional<FootballFixture> findByApiFixtureId(Long apiFixtureId);

    /**
     * Find fixtures by date range
     */
    @Query("SELECT f FROM FootballFixture f WHERE f.fixtureDate BETWEEN :startDate AND :endDate ORDER BY f.fixtureDate ASC")
    List<FootballFixture> findFixturesByDateRange(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find fixtures by date range and league
     */
    @Query("SELECT f FROM FootballFixture f WHERE f.fixtureDate BETWEEN :startDate AND :endDate " +
           "AND (:leagueName IS NULL OR f.leagueName = :leagueName) ORDER BY f.fixtureDate ASC")
    List<FootballFixture> findFixturesByDateRangeAndLeague(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate,
        @Param("leagueName") String leagueName
    );

    /**
     * Find today's fixtures
     */
    @Query("SELECT f FROM FootballFixture f WHERE CAST(f.fixtureDate AS date) = CURRENT_DATE ORDER BY f.fixtureDate ASC")
    List<FootballFixture> findTodaysFixtures();

    /**
     * Find live fixtures
     */
    @Query("SELECT f FROM FootballFixture f WHERE f.isLive = true ORDER BY f.fixtureDate ASC")
    List<FootballFixture> findLiveFixtures();

    /**
     * Find fixtures that need AI processing
     */
    @Query("SELECT f FROM FootballFixture f WHERE f.aiProcessed = false ORDER BY f.importanceScore DESC, f.fixtureDate ASC")
    List<FootballFixture> findFixturesNeedingAiProcessing(Pageable pageable);

    /**
     * Find high importance fixtures
     */
    @Query("SELECT f FROM FootballFixture f WHERE f.importanceScore >= :minImportance " +
           "AND f.fixtureDate BETWEEN :startDate AND :endDate ORDER BY f.importanceScore DESC, f.fixtureDate ASC")
    List<FootballFixture> findHighImportanceFixtures(
        @Param("minImportance") Integer minImportance,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find fixtures by teams
     */
    @Query("SELECT f FROM FootballFixture f WHERE f.homeTeam = :teamName OR f.awayTeam = :teamName " +
           "ORDER BY f.fixtureDate DESC")
    List<FootballFixture> findFixturesByTeam(@Param("teamName") String teamName);

    /**
     * Count fixtures by cache date
     */
    @Query("SELECT COUNT(f) FROM FootballFixture f WHERE f.cacheDate >= :startOfDay AND f.cacheDate < :endOfDay")
    Long countTodaysCachedFixtures(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    /**
     * Delete old cached fixtures (older than specified days)
     */
    @Query("DELETE FROM FootballFixture f WHERE f.cacheDate < :cutoffDate")
    @Modifying
    void deleteOldCachedFixtures(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Find fixtures by league and season
     */
    @Query("SELECT f FROM FootballFixture f WHERE f.leagueName = :leagueName AND f.season = :season " +
           "ORDER BY f.fixtureDate ASC")
    Page<FootballFixture> findByLeagueAndSeason(
        @Param("leagueName") String leagueName, 
        @Param("season") String season, 
        Pageable pageable
    );

    /**
     * Search fixtures by team names or league
     */
    @Query("SELECT f FROM FootballFixture f WHERE " +
           "LOWER(f.homeTeam) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.awayTeam) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.leagueName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY f.fixtureDate DESC")
    List<FootballFixture> searchFixtures(@Param("query") String query);
}
