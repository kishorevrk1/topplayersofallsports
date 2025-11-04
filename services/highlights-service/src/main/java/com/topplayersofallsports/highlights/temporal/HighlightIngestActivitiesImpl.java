package com.topplayersofallsports.highlights.temporal;

import com.google.api.services.youtube.model.PlaylistItem;
import com.google.api.services.youtube.model.Video;
import com.topplayersofallsports.highlights.domain.model.Highlight;
import com.topplayersofallsports.highlights.domain.model.HighlightSource;
import com.topplayersofallsports.highlights.infrastructure.youtube.QuotaManager;
import com.topplayersofallsports.highlights.infrastructure.youtube.YouTubeClient;
import com.topplayersofallsports.highlights.service.HighlightService;
import com.topplayersofallsports.highlights.service.HighlightSourceService;
import io.temporal.spring.boot.ActivityImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Temporal activities implementation for highlight ingestion.
 * 
 * Implements the actual work of fetching from YouTube, mapping to domain models,
 * and persisting to database. Each activity is idempotent.
 * 
 * Production-ready with quota management, error handling, and comprehensive logging.
 */
@Component
@ActivityImpl(taskQueues = "highlights-ingest")
@RequiredArgsConstructor
@Slf4j
public class HighlightIngestActivitiesImpl implements HighlightIngestActivities {

    private final HighlightSourceService sourceService;
    private final HighlightService highlightService;
    private final YouTubeClient youTubeClient;
    private final QuotaManager quotaManager;

    @Override
    public SourceDetails fetchSourceDetails(Long sourceId) {
        log.info("Fetching source details for id: {}", sourceId);
        
        Optional<HighlightSource> sourceOpt = sourceService.findById(sourceId);
        
        if (sourceOpt.isEmpty()) {
            log.warn("Source {} not found", sourceId);
            return null;
        }
        
        HighlightSource source = sourceOpt.get();
        
        if (!source.getActive()) {
            log.warn("Source {} is inactive", sourceId);
            return null;
        }
        
        return new SourceDetails(
            source.getId(),
            source.getType().name(),
            source.getName(),
            source.getChannelId(),
            source.getPlaylistId(),
            source.getSport(),
            source.getLeagueId(),
            source.getLastVideoPublishedAt() != null 
                ? source.getLastVideoPublishedAt().toString() 
                : null
        );
    }

    @Override
    public List<String> fetchVideoIdsFromSource(SourceDetails sourceDetails) {
        log.info("Fetching video IDs from source: {} (type: {})", 
            sourceDetails.name(), sourceDetails.type());
        
        // Check quota before making API call
        if (!quotaManager.hasQuota(QuotaManager.QuotaCost.PLAYLIST_ITEMS_LIST)) {
            log.error("Insufficient YouTube API quota. Remaining: {}", quotaManager.getQuotaRemaining());
            throw new RuntimeException("YouTube API quota exhausted");
        }
        
        try {
            List<String> videoIds = new ArrayList<>();
            
            // Parse last published timestamp for incremental fetch
            Instant publishedAfter = null;
            if (sourceDetails.lastVideoPublishedAt() != null) {
                publishedAfter = Instant.parse(sourceDetails.lastVideoPublishedAt());
            }
            
            if ("YOUTUBE_PLAYLIST".equals(sourceDetails.type())) {
                // Fetch from playlist (preferred, 1 quota unit)
                List<PlaylistItem> items = youTubeClient.fetchPlaylistItems(
                    sourceDetails.playlistId(), 
                    50L, 
                    publishedAfter
                );
                
                videoIds = items.stream()
                    .map(item -> item.getContentDetails().getVideoId())
                    .collect(Collectors.toList());
                
                quotaManager.consumeQuota(QuotaManager.QuotaCost.PLAYLIST_ITEMS_LIST);
                
            } else if ("YOUTUBE_CHANNEL".equals(sourceDetails.type())) {
                // Fetch from channel search (expensive, 100 quota units)
                log.warn("Using channel search for source: {}", sourceDetails.name());
                
                if (!quotaManager.hasQuota(QuotaManager.QuotaCost.SEARCH_LIST)) {
                    log.error("Insufficient quota for channel search");
                    return List.of();
                }
                
                var searchResults = youTubeClient.searchChannelVideos(
                    sourceDetails.channelId(), 
                    25L, 
                    publishedAfter
                );
                
                videoIds = searchResults.stream()
                    .map(result -> result.getId().getVideoId())
                    .collect(Collectors.toList());
                
                quotaManager.consumeQuota(QuotaManager.QuotaCost.SEARCH_LIST);
            }
            
            log.info("Fetched {} video IDs from source: {}", videoIds.size(), sourceDetails.name());
            return videoIds;
            
        } catch (Exception e) {
            log.error("Failed to fetch video IDs from source: {}", sourceDetails.name(), e);
            throw new RuntimeException("Failed to fetch video IDs", e);
        }
    }

    @Override
    public List<HighlightIngestActivities.VideoDetailsDTO> fetchVideoDetails(List<String> videoIds) {
        log.info("Fetching details for {} videos", videoIds.size());
        
        if (videoIds.isEmpty()) {
            return List.of();
        }
        
        // Check quota (1 unit per batch of up to 50 videos)
        int batchCount = (int) Math.ceil(videoIds.size() / 50.0);
        if (!quotaManager.hasQuota(batchCount * QuotaManager.QuotaCost.VIDEOS_LIST)) {
            log.error("Insufficient YouTube API quota for video details");
            throw new RuntimeException("YouTube API quota exhausted");
        }
        
        try {
            List<Video> videos = youTubeClient.fetchVideoDetails(videoIds);
            quotaManager.consumeQuota(batchCount * QuotaManager.QuotaCost.VIDEOS_LIST);
            
            // Convert Google Video objects to simple DTOs
            List<HighlightIngestActivities.VideoDetailsDTO> dtos = videos.stream()
                .map(this::convertToDTO)
                .toList();
            
            log.info("Fetched details for {} videos", dtos.size());
            return dtos;
            
        } catch (Exception e) {
            log.error("Failed to fetch video details", e);
            throw new RuntimeException("Failed to fetch video details", e);
        }
    }
    
    /**
     * Convert Google Video object to simple DTO.
     */
    private HighlightIngestActivities.VideoDetailsDTO convertToDTO(Video video) {
        var snippet = video.getSnippet();
        var statistics = video.getStatistics();
        var contentDetails = video.getContentDetails();
        
        // Parse duration from ISO 8601 format (e.g., "PT4M13S")
        Integer durationSeconds = null;
        if (contentDetails != null && contentDetails.getDuration() != null) {
            durationSeconds = parseDuration(contentDetails.getDuration());
        }
        
        return new HighlightIngestActivities.VideoDetailsDTO(
            video.getId(),
            snippet != null ? snippet.getTitle() : "",
            snippet != null ? snippet.getDescription() : "",
            snippet != null && snippet.getThumbnails() != null && snippet.getThumbnails().getHigh() != null
                ? snippet.getThumbnails().getHigh().getUrl() : null,
            snippet != null && snippet.getPublishedAt() != null
                ? Instant.ofEpochMilli(snippet.getPublishedAt().getValue()) : Instant.now(),
            durationSeconds,
            statistics != null && statistics.getViewCount() != null
                ? statistics.getViewCount().longValue() : 0L,
            statistics != null && statistics.getLikeCount() != null
                ? statistics.getLikeCount().longValue() : 0L,
            snippet != null ? snippet.getChannelTitle() : ""
        );
    }
    
    /**
     * Parse ISO 8601 duration to seconds (e.g., "PT4M13S" -> 253).
     */
    private Integer parseDuration(String isoDuration) {
        try {
            return (int) java.time.Duration.parse(isoDuration).getSeconds();
        } catch (Exception e) {
            log.warn("Failed to parse duration: {}", isoDuration);
            return null;
        }
    }

    @Override
    public int saveHighlights(List<HighlightIngestActivities.VideoDetailsDTO> videos, Long sourceId) {
        log.info("Saving {} highlights for source: {}", videos.size(), sourceId);
        
        if (videos.isEmpty()) {
            return 0;
        }
        
        // Get source details once for all videos
        SourceDetails sourceDetails = fetchSourceDetails(sourceId);
        
        // Fetch channel info once (1 quota unit)
        String channelName = null;
        String channelThumbnail = null;
        if (!videos.isEmpty() && videos.get(0).channelTitle() != null) {
            channelName = videos.get(0).channelTitle();
            
            // Try to get channel thumbnail from first video's channel ID
            // Note: channelTitle is already in the video details, so we use that
            // Thumbnail can be fetched later if needed, or from source
            if (sourceDetails != null && sourceDetails.channelId() != null) {
                try {
                    var channel = youTubeClient.getChannelInfo(sourceDetails.channelId());
                    if (channel != null && channel.getSnippet() != null) {
                        channelName = channel.getSnippet().getTitle();
                        if (channel.getSnippet().getThumbnails() != null && 
                            channel.getSnippet().getThumbnails().getDefault() != null) {
                            channelThumbnail = channel.getSnippet().getThumbnails().getDefault().getUrl();
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch channel info for source {}: {}", sourceId, e.getMessage());
                }
            }
        }
        
        final String finalChannelName = channelName;
        final String finalChannelThumbnail = channelThumbnail;
        
        // Map all DTOs to Highlight entities
        List<Highlight> highlights = videos.stream()
            .map(video -> Highlight.builder()
                .platform(Highlight.Platform.YOUTUBE)
                .videoId(video.videoId())
                .title(video.title())
                .description(video.description())
                .url("https://www.youtube.com/watch?v=" + video.videoId())
                .thumbnailUrl(video.thumbnailUrl())
                .publishedAt(video.publishedAt())
                .durationSec(video.durationSeconds())
                .viewCount(video.viewCount())
                .likeCount(video.likeCount())
                .sport(sourceDetails != null ? sourceDetails.sport() : null)
                .leagueId(sourceDetails != null ? sourceDetails.leagueId() : null)
                .sourceId(sourceId)
                .channelName(finalChannelName)
                .channelThumbnail(finalChannelThumbnail)
                .videoType(Highlight.VideoType.HIGHLIGHT)
                .isFeatured(false)
                .build())
            .toList();
        
        // Batch save all highlights (single query to check existing + batch insert/update)
        HighlightService.BatchSaveResult result = highlightService.batchSave(highlights);
        
        log.info("Batch save completed: {} new, {} updated, {} skipped out of {} total", 
            result.newCount(), result.updatedCount(), result.skippedCount(), videos.size());
        
        return result.totalProcessed();
    }

    @Override
    public void markSourceAsIngested(Long sourceId) {
        log.info("Marking source {} as ingested", sourceId);
        
        try {
            // Get the latest video timestamp from saved highlights
            // For simplicity, we'll just mark with current time
            sourceService.markIngested(sourceId, Instant.now());
            
            log.info("Source {} marked as ingested", sourceId);
            
        } catch (Exception e) {
            log.error("Failed to mark source as ingested: {}", sourceId, e);
            // Don't throw - this is not critical for the workflow
        }
    }
}
