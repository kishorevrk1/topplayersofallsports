package com.topplayersofallsports.highlights.repository;

import com.topplayersofallsports.highlights.domain.model.Highlight;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Highlight entity with optimized queries.
 * 
 * Uses Spring Data JPA with custom queries for performance.
 * All queries are designed to leverage PostgreSQL indexes.
 */
@Repository
public interface HighlightRepository extends JpaRepository<Highlight, Long> {

    /**
     * Find highlight by platform and video ID (natural key).
     * Used for idempotent upserts during ingest.
     */
    Optional<Highlight> findByPlatformAndVideoId(
        Highlight.Platform platform, 
        String videoId
    );

    /**
     * Batch find highlights by platform and video IDs.
     * Optimized for bulk upsert operations - single query instead of N queries.
     */
    List<Highlight> findByPlatformAndVideoIdIn(
        Highlight.Platform platform,
        List<String> videoIds
    );

    /**
     * Find highlights with filters and pagination.
     * Optimized with index on (sport, league_id, published_at).
     */
    @Query("""
        SELECT h FROM Highlight h
        WHERE (:sport IS NULL OR h.sport = :sport)
        AND (:leagueId IS NULL OR h.leagueId = :leagueId)
        AND (CAST(:startDate AS timestamp) IS NULL OR h.publishedAt >= :startDate)
        AND (CAST(:endDate AS timestamp) IS NULL OR h.publishedAt <= :endDate)
        ORDER BY h.publishedAt DESC
        """)
    Page<Highlight> findWithFilters(
        @Param("sport") String sport,
        @Param("leagueId") String leagueId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Search highlights by query string in title, description, and channel name.
     * Full-text search with case-insensitive matching.
     */
    @Query("""
        SELECT h FROM Highlight h
        WHERE (:sport IS NULL OR h.sport = :sport)
        AND (
            LOWER(h.title) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(h.description) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(h.channelName) LIKE LOWER(CONCAT('%', :query, '%'))
        )
        ORDER BY h.publishedAt DESC
        """)
    Page<Highlight> searchHighlights(
        @Param("query") String query,
        @Param("sport") String sport,
        Pageable pageable
    );

    /**
     * Find highlights by entity (team, player, league, game).
     * Uses join with highlight_entities table.
     */
    @Query("""
        SELECT DISTINCT h FROM Highlight h
        JOIN h.entities e
        WHERE e.entityType = :entityType
        AND e.entityId = :entityId
        ORDER BY h.publishedAt DESC
        """)
    Page<Highlight> findByEntity(
        @Param("entityType") com.topplayersofallsports.highlights.domain.model.HighlightEntity.EntityType entityType,
        @Param("entityId") String entityId,
        Pageable pageable
    );

    /**
     * Find trending highlights (recent + high engagement).
     * Uses calculated engagement score for ranking.
     */
    @Query(value = """
        SELECT h.* FROM highlights h
        WHERE h.published_at >= :since
        AND (:sport IS NULL OR h.sport = :sport)
        ORDER BY 
            (COALESCE(h.view_count, 0) * 0.1 + COALESCE(h.like_count, 0) * 10) DESC,
            h.published_at DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Highlight> findTrending(
        @Param("since") Instant since,
        @Param("sport") String sport,
        @Param("limit") int limit
    );

    /**
     * Find highlights by source for deduplication checks.
     */
    List<Highlight> findBySourceIdAndPublishedAtAfter(
        Long sourceId, 
        Instant publishedAfter
    );

    /**
     * Count highlights by sport for analytics.
     */
    @Query("SELECT h.sport, COUNT(h) FROM Highlight h GROUP BY h.sport")
    List<Object[]> countBySport();

    /**
     * Find featured highlights for carousel.
     * Optimized with index on (is_featured, published_at).
     */
    @Query("""
        SELECT h FROM Highlight h
        WHERE h.isFeatured = true
        AND (:sport IS NULL OR h.sport = :sport)
        ORDER BY h.publishedAt DESC
        """)
    List<Highlight> findFeatured(
        @Param("sport") String sport,
        Pageable pageable
    );

    /**
     * Find highlights by player and video type.
     * Used for player profile video tabs.
     */
    @Query("""
        SELECT DISTINCT h FROM Highlight h
        JOIN h.entities e
        WHERE e.entityType = 'PLAYER'
        AND e.entityId = :playerId
        AND (:videoType IS NULL OR h.videoType = :videoType)
        ORDER BY h.publishedAt DESC
        """)
    Page<Highlight> findByPlayerAndVideoType(
        @Param("playerId") String playerId,
        @Param("videoType") com.topplayersofallsports.highlights.domain.model.Highlight.VideoType videoType,
        Pageable pageable
    );

    /**
     * Count highlights by video type for a specific player.
     * Returns counts for each category (highlights, interviews, training, etc.)
     */
    @Query("""
        SELECT h.videoType, COUNT(h) FROM Highlight h
        JOIN h.entities e
        WHERE e.entityType = 'PLAYER'
        AND e.entityId = :playerId
        GROUP BY h.videoType
        """)
    List<Object[]> countByPlayerGroupByVideoType(@Param("playerId") String playerId);

    /**
     * Find related videos based on sport, team, and players.
     * Excludes the current video and orders by relevance.
     */
    @Query("""
        SELECT DISTINCT h FROM Highlight h
        LEFT JOIN h.entities e
        WHERE h.id != :currentVideoId
        AND (h.sport = :sport OR e.entityId IN :entityIds)
        ORDER BY 
            CASE WHEN e.entityId IN :entityIds THEN 0 ELSE 1 END,
            h.publishedAt DESC
        """)
    List<Highlight> findRelated(
        @Param("currentVideoId") Long currentVideoId,
        @Param("sport") String sport,
        @Param("entityIds") List<String> entityIds,
        Pageable pageable
    );

    /**
     * Update channel information for all highlights from a specific source.
     * Used for backfilling channel info after migration.
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("""
        UPDATE Highlight h
        SET h.channelName = :channelName,
            h.channelThumbnail = :channelThumbnail,
            h.updatedAt = CURRENT_TIMESTAMP
        WHERE h.sourceId = :sourceId
        AND (h.channelName IS NULL OR h.channelThumbnail IS NULL)
        """)
    int updateChannelInfoBySourceId(
        @Param("sourceId") Long sourceId,
        @Param("channelName") String channelName,
        @Param("channelThumbnail") String channelThumbnail
    );
}
