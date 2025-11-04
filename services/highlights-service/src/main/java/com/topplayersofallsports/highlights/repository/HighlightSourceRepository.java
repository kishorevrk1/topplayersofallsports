package com.topplayersofallsports.highlights.repository;

import com.topplayersofallsports.highlights.domain.model.HighlightSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for HighlightSource entity.
 */
@Repository
public interface HighlightSourceRepository extends JpaRepository<HighlightSource, Long> {

    /**
     * Find all active sources ordered by weight (priority).
     * Used by Temporal scheduler to determine ingest order.
     */
    @Query("SELECT s FROM HighlightSource s WHERE s.active = true ORDER BY s.weight DESC, s.id ASC")
    List<HighlightSource> findAllActiveOrderedByWeight();

    /**
     * Find active sources by sport for targeted ingest.
     */
    List<HighlightSource> findBySportAndActiveTrue(String sport);

    /**
     * Find sources by league for targeted ingest.
     */
    List<HighlightSource> findByLeagueIdAndActiveTrue(String leagueId);

    /**
     * Find all sources by active status.
     * Used for backfilling channel information.
     */
    List<HighlightSource> findByActive(boolean active);
}
