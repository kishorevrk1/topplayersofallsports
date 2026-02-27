package com.topplayersofallsports.highlights.service;

import com.topplayersofallsports.highlights.config.ChannelMappingConfig;
import com.google.api.services.youtube.model.Channel;
import com.topplayersofallsports.highlights.domain.model.HighlightSource;
import com.topplayersofallsports.highlights.infrastructure.youtube.YouTubeClient;
import com.topplayersofallsports.highlights.repository.HighlightRepository;
import com.topplayersofallsports.highlights.repository.HighlightSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * One-time service to backfill channel information for existing highlights.
 * This populates channel_name and channel_thumbnail for videos that were
 * ingested before the channel info feature was added.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChannelInfoBackfillService {

    private final HighlightSourceRepository sourceRepository;
    private final HighlightRepository highlightRepository;
    private final YouTubeClient youTubeClient;
    private final ChannelMappingConfig channelMappingConfig;

    /**
     * Backfill channel information for all highlights.
     * This should be run once after the channel info migration.
     */
    @Transactional
    public void backfillAllChannelInfo() {
        log.info("Starting channel info backfill for all highlights");
        
        List<HighlightSource> sources = sourceRepository.findByActive(true);
        log.info("Found {} active sources to process", sources.size());
        
        int totalUpdated = 0;
        int totalFailed = 0;
        
        for (HighlightSource source : sources) {
            try {
                int updated = backfillChannelInfoForSource(source);
                totalUpdated += updated;
                log.info("Updated {} highlights for source: {}", updated, source.getName());
                
                // Small delay to avoid rate limiting
                Thread.sleep(100);
            } catch (Exception e) {
                totalFailed++;
                log.error("Failed to backfill channel info for source {}: {}", 
                    source.getName(), e.getMessage());
            }
        }
        
        log.info("Channel info backfill completed. Updated: {}, Failed: {}", 
            totalUpdated, totalFailed);
    }

    /**
     * Backfill channel information for a specific source.
     */
    @Transactional
    public int backfillChannelInfoForSource(HighlightSource source) {
        if (source.getChannelId() == null) {
            log.warn("Source {} has no channel ID, using source name instead", source.getName());
            return updateHighlightsWithSourceName(source);
        }

        try {
            // Fetch channel info from YouTube
            Channel channel = youTubeClient.getChannelInfo(source.getChannelId());
            
            if (channel == null || channel.getSnippet() == null) {
                log.warn("Could not fetch channel info for source: {}", source.getName());
                return updateHighlightsWithSourceName(source);
            }

            String channelName = channel.getSnippet().getTitle();
            String channelThumbnail = null;
            
            if (channel.getSnippet().getThumbnails() != null) {
                // Try to get the best quality thumbnail available
                var thumbnails = channel.getSnippet().getThumbnails();
                if (thumbnails.getHigh() != null) {
                    channelThumbnail = thumbnails.getHigh().getUrl();
                } else if (thumbnails.getMedium() != null) {
                    channelThumbnail = thumbnails.getMedium().getUrl();
                } else if (thumbnails.getDefault() != null) {
                    channelThumbnail = thumbnails.getDefault().getUrl();
                }
            }

            log.debug("Fetched channel info - Name: {}, Thumbnail: {}", 
                channelName, channelThumbnail != null ? "Yes" : "No");

            // Update all highlights from this source
            return updateHighlightsWithChannelInfo(
                source.getId(), 
                channelName, 
                channelThumbnail
            );

        } catch (Exception e) {
            log.error("Error fetching channel info for source {}: {}", 
                source.getName(), e.getMessage());
            return updateHighlightsWithSourceName(source);
        }
    }

    /**
     * Update highlights with channel information.
     */
    private int updateHighlightsWithChannelInfo(
        Long sourceId, 
        String channelName, 
        String channelThumbnail
    ) {
        int updated = highlightRepository.updateChannelInfoBySourceId(
            sourceId, 
            channelName, 
            channelThumbnail
        );
        
        log.info("Updated {} highlights with channel info for source ID: {}", 
            updated, sourceId);
        
        return updated;
    }

    /**
     * Fallback: Update highlights with just the source name.
     */
    private int updateHighlightsWithSourceName(HighlightSource source) {
        int updated = highlightRepository.updateChannelInfoBySourceId(
            source.getId(), 
            source.getName(), 
            null
        );
        
        log.info("Updated {} highlights with source name for: {}", 
            updated, source.getName());
        
        return updated;
    }

    /**
     * Add YouTube channel IDs to all sources.
     * Loads mappings from channel-mappings.yml configuration file.
     * This makes it easy to add new channels without code changes.
     */
    @Transactional
    public int addChannelIdsToSources() {
        log.info("Adding YouTube channel IDs to all sources from configuration");
        
        int updated = 0;
        int skipped = 0;
        
        // Get channel mappings from configuration file
        Map<String, String> channelIds = channelMappingConfig.getAllMappings();
        log.info("Loaded {} channel mappings from configuration", channelIds.size());
        
        List<HighlightSource> sources = sourceRepository.findByActive(true);
        log.info("Found {} active sources to process", sources.size());
        
        for (HighlightSource source : sources) {
            String channelId = channelIds.get(source.getName());
            if (channelId != null) {
                source.setChannelId(channelId);
                sourceRepository.save(source);
                updated++;
                log.info("✓ Added channel ID for: {} -> {}", source.getName(), channelId);
            } else {
                skipped++;
                log.warn("✗ No channel ID mapping for source: {} (add to channel-mappings.yml)", 
                    source.getName());
            }
        }
        
        log.info("Channel IDs added. Updated: {}, Skipped: {}, Total: {}", 
            updated, skipped, sources.size());
        return updated;
    }
    
    /**
     * List all sources with their channel ID status.
     * Useful for debugging which sources need channel IDs.
     */
    public List<Map<String, Object>> listAllSources() {
        List<HighlightSource> sources = sourceRepository.findByActive(true);
        Map<String, String> channelIds = channelMappingConfig.getAllMappings();
        
        return sources.stream()
            .map(source -> Map.of(
                "id", (Object) source.getId(),
                "name", (Object) source.getName(),
                "sport", (Object) (source.getSport() != null ? source.getSport().toString() : "N/A"),
                "channelId", (Object) (source.getChannelId() != null ? source.getChannelId() : "NULL"),
                "hasMapping", (Object) channelIds.containsKey(source.getName()),
                "mappedChannelId", (Object) (channelIds.get(source.getName()) != null ? channelIds.get(source.getName()) : "N/A")
            ))
            .collect(java.util.stream.Collectors.toList());
    }
}
