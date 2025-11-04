package com.topplayersofallsports.highlights.service;

import com.topplayersofallsports.highlights.domain.model.Highlight;
import com.topplayersofallsports.highlights.repository.HighlightRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Business logic for highlights management.
 * 
 * Handles CRUD operations, filtering, trending, and featured highlights.
 * Production-ready with caching, transactions, and comprehensive error handling.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HighlightService {

    private final HighlightRepository highlightRepository;

    /**
     * Find highlight by ID.
     */
    @Transactional(readOnly = true)
    public Optional<Highlight> findById(Long id) {
        log.debug("Finding highlight by id: {}", id);
        return highlightRepository.findById(id);
    }

    /**
     * Find highlight by platform and video ID (natural key).
     */
    @Transactional(readOnly = true)
    public Optional<Highlight> findByPlatformAndVideoId(Highlight.Platform platform, String videoId) {
        log.debug("Finding highlight by platform: {} and videoId: {}", platform, videoId);
        return highlightRepository.findByPlatformAndVideoId(platform, videoId);
    }

    /**
     * Find highlights with filters and pagination.
     */
    @Transactional(readOnly = true)
    public Page<Highlight> findWithFilters(
        String sport,
        String leagueId,
        Instant startDate,
        Instant endDate,
        Pageable pageable
    ) {
        log.debug("Finding highlights with filters - sport: {}, league: {}, dates: {} to {}", 
            sport, leagueId, startDate, endDate);
        return highlightRepository.findWithFilters(sport, leagueId, startDate, endDate, pageable);
    }

    /**
     * Search highlights by query string.
     * Searches in title, description, and channel name.
     */
    @Transactional(readOnly = true)
    public Page<Highlight> searchHighlights(String query, String sport, Pageable pageable) {
        log.debug("Searching highlights with query: '{}', sport: {}", query, sport);
        
        if (query == null || query.trim().isEmpty()) {
            // If no query, return all with filters
            return findWithFilters(sport, null, null, null, pageable);
        }
        
        return highlightRepository.searchHighlights(query.trim(), sport, pageable);
    }

    /**
     * Find featured highlights for carousel.
     * Cached for 10 minutes.
     */
    @Cacheable(value = "featured", key = "#sport + '-' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public List<Highlight> findFeatured(String sport, Pageable pageable) {
        log.debug("Finding featured highlights for sport: {}", sport);
        return highlightRepository.findFeatured(sport, pageable);
    }

    /**
     * Find trending highlights.
     * Caching disabled due to lazy loading issues with entities collection.
     */
    // @Cacheable(value = "trending", key = "#sport + '-' + #limit")
    @Transactional(readOnly = true)
    public List<Highlight> findTrending(String sport, int limit) {
        log.debug("Finding trending highlights for sport: {}, limit: {}", sport, limit);
        Instant since = Instant.now().minusSeconds(48 * 3600); // Last 48 hours
        return highlightRepository.findTrending(since, sport, limit);
    }

    /**
     * Find highlights by player and video type.
     * Used for player profile videos tab.
     * Cached for 15 minutes.
     */
    @Cacheable(value = "playerVideos", key = "#playerId + '-' + #videoType + '-' + #pageable.pageNumber")
    @Transactional(readOnly = true)
    public Page<Highlight> findByPlayerAndVideoType(
        String playerId,
        Highlight.VideoType videoType,
        Pageable pageable
    ) {
        log.debug("Finding highlights for player: {}, type: {}", playerId, videoType);
        return highlightRepository.findByPlayerAndVideoType(playerId, videoType, pageable);
    }

    /**
     * Count highlights by video type for a player.
     * Returns map of VideoType -> count.
     * Cached for 30 minutes.
     */
    @Cacheable(value = "videoCounts", key = "#playerId")
    @Transactional(readOnly = true)
    public java.util.Map<Highlight.VideoType, Long> countByPlayerGroupByVideoType(String playerId) {
        log.debug("Counting videos by type for player: {}", playerId);
        
        List<Object[]> results = highlightRepository.countByPlayerGroupByVideoType(playerId);
        
        java.util.Map<Highlight.VideoType, Long> counts = new java.util.HashMap<>();
        for (Object[] result : results) {
            Highlight.VideoType type = (Highlight.VideoType) result[0];
            Long count = (Long) result[1];
            counts.put(type, count);
        }
        
        return counts;
    }

    /**
     * Find related highlights for a video.
     */
    @Transactional(readOnly = true)
    public List<Highlight> findRelated(Long currentVideoId, String sport, List<String> entityIds, int limit) {
        log.debug("Finding related videos for: {}, sport: {}, entities: {}", 
            currentVideoId, sport, entityIds);
        return highlightRepository.findRelated(
            currentVideoId, 
            sport, 
            entityIds, 
            Pageable.ofSize(limit)
        );
    }

    /**
     * Save or update a highlight.
     * Performs upsert based on platform + videoId.
     */
    @Transactional
    public Highlight save(Highlight highlight) {
        log.debug("Saving highlight: {} (platform: {}, videoId: {})", 
            highlight.getTitle(), highlight.getPlatform(), highlight.getVideoId());
        
        // Check if highlight already exists
        Optional<Highlight> existing = highlightRepository.findByPlatformAndVideoId(
            highlight.getPlatform(), 
            highlight.getVideoId()
        );
        
        if (existing.isPresent()) {
            // Update existing highlight
            Highlight existingHighlight = existing.get();
            updateExistingHighlight(existingHighlight, highlight);
            log.debug("Updating existing highlight id: {}", existingHighlight.getId());
            return highlightRepository.save(existingHighlight);
        } else {
            // Create new highlight
            log.debug("Creating new highlight");
            return highlightRepository.save(highlight);
        }
    }

    /**
     * Update existing highlight with new data.
     * Preserves ID and creation timestamp.
     */
    private void updateExistingHighlight(Highlight existing, Highlight newData) {
        existing.setTitle(newData.getTitle());
        existing.setDescription(newData.getDescription());
        existing.setUrl(newData.getUrl());
        existing.setThumbnailUrl(newData.getThumbnailUrl());
        existing.setDurationSec(newData.getDurationSec());
        existing.setSport(newData.getSport());
        existing.setLeagueId(newData.getLeagueId());
        existing.setViewCount(newData.getViewCount());
        existing.setLikeCount(newData.getLikeCount());
        existing.setStatsJson(newData.getStatsJson());
        existing.setVideoType(newData.getVideoType());
        existing.setIsFeatured(newData.getIsFeatured());
        // Note: publishedAt, sourceId, and entities are not updated
    }

    /**
     * Delete highlight by ID.
     */
    @Transactional
    public void deleteById(Long id) {
        log.info("Deleting highlight id: {}", id);
        highlightRepository.deleteById(id);
    }

    /**
     * Get total count of highlights.
     */
    @Transactional(readOnly = true)
    public long count() {
        return highlightRepository.count();
    }

    /**
     * Batch save or update highlights.
     * Optimized for bulk ingestion with single query to check existing videos.
     * Returns metrics about the operation.
     */
    @Transactional
    @CacheEvict(value = {"trending", "featured"}, allEntries = true)
    public BatchSaveResult batchSave(List<Highlight> highlights) {
        if (highlights == null || highlights.isEmpty()) {
            return new BatchSaveResult(0, 0, 0);
        }

        log.info("Batch saving {} highlights", highlights.size());
        
        // Extract all video IDs to check in single query
        List<String> videoIds = highlights.stream()
            .map(Highlight::getVideoId)
            .distinct()
            .collect(Collectors.toList());
        
        Highlight.Platform platform = highlights.get(0).getPlatform();
        
        // Single query to fetch all existing highlights
        List<Highlight> existingHighlights = highlightRepository
            .findByPlatformAndVideoIdIn(platform, videoIds);
        
        // Create lookup map for O(1) access
        Map<String, Highlight> existingMap = existingHighlights.stream()
            .collect(Collectors.toMap(Highlight::getVideoId, h -> h));
        
        List<Highlight> toSave = new ArrayList<>();
        int newCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        
        for (Highlight highlight : highlights) {
            try {
                Highlight existing = existingMap.get(highlight.getVideoId());
                
                if (existing != null) {
                    // Update existing
                    updateExistingHighlight(existing, highlight);
                    toSave.add(existing);
                    updatedCount++;
                } else {
                    // New highlight
                    toSave.add(highlight);
                    newCount++;
                }
            } catch (Exception e) {
                log.error("Error processing highlight: {}", highlight.getVideoId(), e);
                skippedCount++;
            }
        }
        
        // Batch save all at once
        if (!toSave.isEmpty()) {
            highlightRepository.saveAll(toSave);
        }
        
        log.info("Batch save completed: {} new, {} updated, {} skipped", 
            newCount, updatedCount, skippedCount);
        
        return new BatchSaveResult(newCount, updatedCount, skippedCount);
    }

    /**
     * Result of batch save operation.
     */
    public record BatchSaveResult(
        int newCount,
        int updatedCount,
        int skippedCount
    ) {
        public int totalProcessed() {
            return newCount + updatedCount;
        }
    }
}
