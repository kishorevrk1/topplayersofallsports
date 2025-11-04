package com.topplayersofallsports.highlights.infrastructure.youtube;

import com.google.api.services.youtube.model.PlaylistItem;
import com.google.api.services.youtube.model.Video;
import com.google.api.services.youtube.model.VideoContentDetails;
import com.google.api.services.youtube.model.VideoStatistics;
import com.topplayersofallsports.highlights.domain.model.Highlight;
import com.topplayersofallsports.highlights.domain.util.VideoTypeDetector;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Maps YouTube API responses to domain models.
 * 
 * Handles conversion from YouTube Data API v3 objects to Highlight entities.
 * Includes video type detection and featured flag determination.
 * 
 * Production-ready with null-safe handling and comprehensive logging.
 */
@Component
@Slf4j
public class YouTubeMapper {

    /**
     * Map YouTube PlaylistItem and Video details to Highlight domain model.
     * 
     * @param playlistItem YouTube playlist item (basic info)
     * @param video YouTube video details (full metadata)
     * @param sourceId ID of the HighlightSource this came from
     * @return Highlight entity ready for persistence
     */
    public Highlight mapToHighlight(PlaylistItem playlistItem, Video video, Long sourceId) {
        String videoId = playlistItem.getContentDetails().getVideoId();
        String title = video.getSnippet().getTitle();
        String description = video.getSnippet().getDescription();
        
        // Parse published date
        Instant publishedAt = Instant.parse(video.getSnippet().getPublishedAt().toString());
        
        // Parse duration (ISO 8601 format: PT#M#S)
        Integer durationSec = parseDuration(video.getContentDetails());
        
        // Extract statistics
        VideoStatistics stats = video.getStatistics();
        Long viewCount = stats != null && stats.getViewCount() != null 
            ? stats.getViewCount().longValue() : 0L;
        Long likeCount = stats != null && stats.getLikeCount() != null 
            ? stats.getLikeCount().longValue() : 0L;
        
        // Detect video type from title and description
        Highlight.VideoType videoType = VideoTypeDetector.detectVideoType(title, description);
        
        // Determine if should be featured
        Boolean isFeatured = VideoTypeDetector.shouldBeFeatured(title, description, viewCount);
        
        // Build thumbnail URL (prefer maxres, fallback to high)
        String thumbnailUrl = extractBestThumbnail(video);
        
        log.debug("Mapping video: {} (type: {}, featured: {})", title, videoType, isFeatured);
        
        return Highlight.builder()
            .platform(Highlight.Platform.YOUTUBE)
            .videoId(videoId)
            .title(title)
            .description(description)
            .url("https://www.youtube.com/watch?v=" + videoId)
            .thumbnailUrl(thumbnailUrl)
            .publishedAt(publishedAt)
            .durationSec(durationSec)
            .viewCount(viewCount)
            .likeCount(likeCount)
            .videoType(videoType)
            .isFeatured(isFeatured)
            .sourceId(sourceId)
            .build();
    }

    /**
     * Parse ISO 8601 duration to seconds.
     * Format: PT#H#M#S (e.g., PT4M13S = 4 minutes 13 seconds = 253 seconds)
     */
    private Integer parseDuration(VideoContentDetails contentDetails) {
        if (contentDetails == null || contentDetails.getDuration() == null) {
            return null;
        }
        
        try {
            String durationStr = contentDetails.getDuration();
            Duration duration = Duration.parse(durationStr);
            return (int) duration.getSeconds();
        } catch (Exception e) {
            log.warn("Failed to parse duration: {}", contentDetails.getDuration(), e);
            return null;
        }
    }

    /**
     * Extract best available thumbnail URL.
     * Priority: maxres > high > medium > default
     */
    private String extractBestThumbnail(Video video) {
        var thumbnails = video.getSnippet().getThumbnails();
        
        if (thumbnails.getMaxres() != null) {
            return thumbnails.getMaxres().getUrl();
        }
        if (thumbnails.getHigh() != null) {
            return thumbnails.getHigh().getUrl();
        }
        if (thumbnails.getMedium() != null) {
            return thumbnails.getMedium().getUrl();
        }
        if (thumbnails.getDefault() != null) {
            return thumbnails.getDefault().getUrl();
        }
        
        return null;
    }
}
