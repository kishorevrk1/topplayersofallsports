package com.topplayersofallsports.highlights.service;

import com.topplayersofallsports.highlights.domain.model.HighlightSource;
import com.topplayersofallsports.highlights.repository.HighlightSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Business logic for highlight sources management.
 * 
 * Manages YouTube channels/playlists that are ingested for highlights.
 * Production-ready with proper transaction handling.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HighlightSourceService {

    private final HighlightSourceRepository sourceRepository;

    /**
     * Find source by ID.
     */
    @Transactional(readOnly = true)
    public Optional<HighlightSource> findById(Long id) {
        return sourceRepository.findById(id);
    }

    /**
     * Find all active sources ordered by weight (priority).
     */
    @Transactional(readOnly = true)
    public List<HighlightSource> findAllActiveOrderedByWeight() {
        log.debug("Finding all active sources ordered by weight");
        return sourceRepository.findAllActiveOrderedByWeight();
    }

    /**
     * Find active sources by sport.
     */
    @Transactional(readOnly = true)
    public List<HighlightSource> findBySport(String sport) {
        log.debug("Finding active sources for sport: {}", sport);
        return sourceRepository.findBySportAndActiveTrue(sport);
    }

    /**
     * Find active sources by league.
     */
    @Transactional(readOnly = true)
    public List<HighlightSource> findByLeague(String leagueId) {
        log.debug("Finding active sources for league: {}", leagueId);
        return sourceRepository.findByLeagueIdAndActiveTrue(leagueId);
    }

    /**
     * Save or update a source.
     */
    @Transactional
    public HighlightSource save(HighlightSource source) {
        log.debug("Saving source: {} (type: {})", source.getName(), source.getType());
        return sourceRepository.save(source);
    }

    /**
     * Mark source as ingested.
     * Updates last_ingested_at and last_video_published_at timestamps.
     */
    @Transactional
    public void markIngested(Long sourceId, Instant lastVideoPublishedAt) {
        log.debug("Marking source {} as ingested", sourceId);
        
        Optional<HighlightSource> sourceOpt = sourceRepository.findById(sourceId);
        if (sourceOpt.isPresent()) {
            HighlightSource source = sourceOpt.get();
            source.markIngested(lastVideoPublishedAt);
            sourceRepository.save(source);
            log.debug("Source {} marked as ingested at {}", sourceId, Instant.now());
        } else {
            log.warn("Source {} not found, cannot mark as ingested", sourceId);
        }
    }

    /**
     * Activate a source.
     */
    @Transactional
    public void activate(Long sourceId) {
        log.info("Activating source: {}", sourceId);
        Optional<HighlightSource> sourceOpt = sourceRepository.findById(sourceId);
        sourceOpt.ifPresent(source -> {
            source.setActive(true);
            sourceRepository.save(source);
        });
    }

    /**
     * Deactivate a source.
     */
    @Transactional
    public void deactivate(Long sourceId) {
        log.info("Deactivating source: {}", sourceId);
        Optional<HighlightSource> sourceOpt = sourceRepository.findById(sourceId);
        sourceOpt.ifPresent(source -> {
            source.setActive(false);
            sourceRepository.save(source);
        });
    }

    /**
     * Delete source by ID.
     */
    @Transactional
    public void deleteById(Long id) {
        log.info("Deleting source id: {}", id);
        sourceRepository.deleteById(id);
    }

    /**
     * Get all sources (including inactive).
     */
    @Transactional(readOnly = true)
    public List<HighlightSource> findAll() {
        return sourceRepository.findAll();
    }
}
