package com.topplayersofallsports.highlights.temporal;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.time.Instant;
import java.util.List;

/**
 * Temporal activities interface for highlight ingestion.
 * 
 * Defines individual steps in the ingestion workflow.
 * Each activity is idempotent and can be retried safely.
 */
@ActivityInterface
public interface HighlightIngestActivities {

    /**
     * Fetch source details from database.
     */
    @ActivityMethod
    SourceDetails fetchSourceDetails(Long sourceId);

    /**
     * Fetch video IDs from YouTube source.
     */
    @ActivityMethod
    List<String> fetchVideoIdsFromSource(SourceDetails sourceDetails);

    /**
     * Fetch detailed video information from YouTube.
     */
    @ActivityMethod
    List<VideoDetailsDTO> fetchVideoDetails(List<String> videoIds);

    /**
     * Map YouTube videos to Highlight entities and save to database.
     */
    @ActivityMethod
    int saveHighlights(List<VideoDetailsDTO> videos, Long sourceId);

    /**
     * Mark source as successfully ingested.
     */
    @ActivityMethod
    void markSourceAsIngested(Long sourceId);

    /**
     * DTO for source details.
     */
    record SourceDetails(
        Long id,
        String type,
        String name,
        String channelId,
        String playlistId,
        String sport,
        String leagueId,
        String lastVideoPublishedAt
    ) {}

    /**
     * Simple DTO for video details (Temporal-serializable).
     */
    record VideoDetailsDTO(
        String videoId,
        String title,
        String description,
        String thumbnailUrl,
        Instant publishedAt,
        Integer durationSeconds,
        Long viewCount,
        Long likeCount,
        String channelTitle
    ) {}
}
