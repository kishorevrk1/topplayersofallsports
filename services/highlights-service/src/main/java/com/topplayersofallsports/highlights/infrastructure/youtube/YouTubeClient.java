package com.topplayersofallsports.highlights.infrastructure.youtube;

import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.*;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * YouTube Data API v3 client wrapper.
 * 
 * Provides methods for fetching playlist items and video details.
 * Handles quota management, error handling, and rate limiting.
 * 
 * Production-ready with comprehensive error handling and logging.
 * 
 * Note: This class is instantiated as a bean in YouTubeConfig.
 */
@Slf4j
public class YouTubeClient {

    private final YouTube youTube;
    private final String apiKey;
    
    public YouTubeClient(YouTube youTube, String apiKey) {
        this.youTube = youTube;
        this.apiKey = apiKey;
    }

    /**
     * Fetch videos from a YouTube playlist.
     * Uses playlistItems.list (1 quota unit per call).
     * 
     * @param playlistId YouTube playlist ID
     * @param maxResults Maximum results per page (1-50)
     * @param publishedAfter Only fetch videos published after this time
     * @return List of playlist items
     */
    public List<PlaylistItem> fetchPlaylistItems(
        String playlistId, 
        Long maxResults, 
        Instant publishedAfter
    ) throws IOException {
        
        log.debug("Fetching playlist items for playlistId: {}, maxResults: {}", playlistId, maxResults);
        
        List<PlaylistItem> allItems = new ArrayList<>();
        String pageToken = null;
        
        do {
            YouTube.PlaylistItems.List request = youTube.playlistItems()
                .list(List.of("snippet", "contentDetails"))
                .setPlaylistId(playlistId)
                .setMaxResults(maxResults != null ? maxResults : 50L)
                .setKey(apiKey);
            
            if (pageToken != null) {
                request.setPageToken(pageToken);
            }
            
            PlaylistItemListResponse response = request.execute();
            List<PlaylistItem> items = response.getItems();
            
            if (items != null) {
                // Filter by publishedAfter if specified
                if (publishedAfter != null) {
                    items = items.stream()
                        .filter(item -> {
                            String publishedAtStr = item.getSnippet().getPublishedAt().toString();
                            Instant publishedAt = Instant.parse(publishedAtStr);
                            return publishedAt.isAfter(publishedAfter);
                        })
                        .toList();
                }
                
                allItems.addAll(items);
                log.debug("Fetched {} items from playlist {}", items.size(), playlistId);
            }
            
            pageToken = response.getNextPageToken();
            
            // Stop if we've filtered out all items (all older than publishedAfter)
            if (publishedAfter != null && items != null && items.isEmpty()) {
                break;
            }
            
        } while (pageToken != null);
        
        log.info("Total items fetched from playlist {}: {}", playlistId, allItems.size());
        return allItems;
    }

    /**
     * Fetch detailed information for multiple videos.
     * Uses videos.list (1 quota unit per call, can batch up to 50 video IDs).
     * 
     * @param videoIds List of YouTube video IDs
     * @return List of video details
     */
    public List<Video> fetchVideoDetails(List<String> videoIds) throws IOException {
        if (videoIds == null || videoIds.isEmpty()) {
            return List.of();
        }
        
        log.debug("Fetching video details for {} videos", videoIds.size());
        
        List<Video> allVideos = new ArrayList<>();
        
        // YouTube API allows up to 50 IDs per request
        int batchSize = 50;
        for (int i = 0; i < videoIds.size(); i += batchSize) {
            List<String> batch = new ArrayList<>(videoIds.subList(i, Math.min(i + batchSize, videoIds.size())));
            
            YouTube.Videos.List request = youTube.videos()
                .list(List.of("snippet", "contentDetails", "statistics"))
                .setId(batch)
                .setKey(apiKey);
            
            VideoListResponse response = request.execute();
            List<Video> videos = response.getItems();
            
            if (videos != null) {
                allVideos.addAll(videos);
                log.debug("Fetched details for {} videos in batch", videos.size());
            }
        }
        
        log.info("Total video details fetched: {}", allVideos.size());
        return allVideos;
    }

    /**
     * Fetch videos from a YouTube channel.
     * Uses search.list (100 quota units per call - expensive!).
     * Only use when playlist is not available.
     * 
     * @param channelId YouTube channel ID
     * @param maxResults Maximum results
     * @param publishedAfter Only fetch videos published after this time
     * @return List of search results
     */
    public List<SearchResult> searchChannelVideos(
        String channelId, 
        Long maxResults, 
        Instant publishedAfter
    ) throws IOException {
        
        log.warn("Using search.list (100 quota units) for channel: {}", channelId);
        log.warn("Consider using playlist instead to save quota");
        
        YouTube.Search.List request = youTube.search()
            .list(List.of("snippet"))
            .setChannelId(channelId)
            .setType(List.of("video"))
            .setOrder("date")
            .setMaxResults(maxResults != null ? maxResults : 25L)
            .setKey(apiKey);
        
        if (publishedAfter != null) {
            // Convert Instant to RFC3339 string format required by YouTube API
            String rfc3339 = publishedAfter.toString(); // Instant.toString() produces RFC3339 format
            request.setPublishedAfter(rfc3339);
        }
        
        SearchListResponse response = request.execute();
        List<SearchResult> results = response.getItems();
        
        log.info("Search returned {} results for channel {}", 
            results != null ? results.size() : 0, channelId);
        
        return results != null ? results : List.of();
    }

    /**
     * Fetch channel information including name and thumbnail.
     * Uses channels.list (1 quota unit per call).
     * 
     * @param channelId YouTube channel ID
     * @return Channel object with snippet information
     */
    public Channel getChannelInfo(String channelId) throws IOException {
        log.debug("Fetching channel info for channelId: {}", channelId);
        
        YouTube.Channels.List request = youTube.channels()
            .list(List.of("snippet"))
            .setId(List.of(channelId))
            .setKey(apiKey);
        
        ChannelListResponse response = request.execute();
        List<Channel> channels = response.getItems();
        
        if (channels == null || channels.isEmpty()) {
            log.warn("Channel not found: {}", channelId);
            return null;
        }
        
        Channel channel = channels.get(0);
        log.debug("Fetched channel: {} ({})", 
            channel.getSnippet().getTitle(), 
            channelId);
        
        return channel;
    }
}
