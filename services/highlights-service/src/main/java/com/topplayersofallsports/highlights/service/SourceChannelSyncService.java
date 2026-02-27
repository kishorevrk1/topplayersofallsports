package com.topplayersofallsports.highlights.service;

import com.topplayersofallsports.highlights.config.ChannelMappingConfig;
import com.topplayersofallsports.highlights.domain.model.HighlightSource;
import com.topplayersofallsports.highlights.repository.HighlightSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Automatically syncs channel IDs and info for all sources.
 * Runs on application startup to ensure all sources have channel data.
 * 
 * This eliminates the need for manual backfill operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SourceChannelSyncService {

    private final HighlightSourceRepository sourceRepository;
    private final ChannelMappingConfig channelMappingConfig;

    /**
     * Automatically sync channel IDs on application startup.
     * This ensures all sources always have the latest channel IDs.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void syncChannelDataOnStartup() {
        log.info("=== Starting automatic channel ID sync ===");
        
        try {
            int idsAdded = syncChannelIds();
            log.info("=== Channel ID sync completed: {} sources updated ===", idsAdded);
        } catch (Exception e) {
            log.error("Error during channel ID sync: {}", e.getMessage(), e);
            // Don't fail application startup, just log the error
        }
    }

    /**
     * Sync channel IDs from configuration to database.
     * Only updates sources that don't have a channel ID yet.
     */
    @Transactional
    public int syncChannelIds() {
        Map<String, String> channelMappings = channelMappingConfig.getAllMappings();
        
        if (channelMappings.isEmpty()) {
            log.warn("No channel mappings configured in application.yml");
            return 0;
        }
        
        log.info("Loaded {} channel mappings from configuration", channelMappings.size());
        
        List<HighlightSource> sources = sourceRepository.findByActive(true);
        int updated = 0;
        
        for (HighlightSource source : sources) {
            // Only update if channel ID is missing
            if (source.getChannelId() == null) {
                String channelId = channelMappings.get(source.getName());
                if (channelId != null) {
                    source.setChannelId(channelId);
                    sourceRepository.save(source);
                    updated++;
                    log.info("✓ Added channel ID for: {} -> {}", source.getName(), channelId);
                } else {
                    log.debug("○ No mapping for source: {} (add to application.yml if needed)", 
                        source.getName());
                }
            }
        }
        
        log.info("Channel ID sync: {} sources updated", updated);
        return updated;
    }
}
