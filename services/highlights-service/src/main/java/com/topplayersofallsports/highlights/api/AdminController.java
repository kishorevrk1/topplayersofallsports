package com.topplayersofallsports.highlights.api;

import com.topplayersofallsports.highlights.service.ChannelInfoBackfillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Admin endpoints for maintenance tasks.
 * These should be protected in production.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Administrative endpoints for maintenance")
public class AdminController {

    private final ChannelInfoBackfillService channelInfoBackfillService;

    /**
     * Backfill channel information for all existing highlights.
     * This is a one-time operation to populate channel_name and channel_thumbnail
     * for videos that were ingested before the feature was added.
     */
    @PostMapping("/backfill-channel-info")
    @Operation(
        summary = "Backfill channel information",
        description = "Fetches and updates channel name and thumbnail for all existing highlights. " +
                     "This is a one-time operation that should be run after the channel info migration."
    )
    public ResponseEntity<Map<String, String>> backfillChannelInfo() {
        log.info("Admin endpoint called: backfill-channel-info");
        
        try {
            // Run backfill in a separate thread to avoid timeout
            new Thread(() -> {
                try {
                    channelInfoBackfillService.backfillAllChannelInfo();
                } catch (Exception e) {
                    log.error("Error during channel info backfill: {}", e.getMessage(), e);
                }
            }).start();
            
            return ResponseEntity.ok(Map.of(
                "status", "started",
                "message", "Channel info backfill started. Check logs for progress."
            ));
        } catch (Exception e) {
            log.error("Failed to start channel info backfill: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Failed to start backfill: " + e.getMessage()
            ));
        }
    }

    /**
     * Add YouTube channel IDs to all sources.
     * This is a one-time setup operation.
     */
    @PostMapping("/add-channel-ids")
    @Operation(
        summary = "Add YouTube channel IDs",
        description = "Populates channel_id for all highlight sources. Required before backfilling channel info."
    )
    public ResponseEntity<Map<String, String>> addChannelIds() {
        log.info("Admin endpoint called: add-channel-ids");
        
        try {
            int updated = channelInfoBackfillService.addChannelIdsToSources();
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Channel IDs added successfully. Updated " + updated + " sources.",
                "updated", String.valueOf(updated)
            ));
        } catch (Exception e) {
            log.error("Failed to add channel IDs: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Failed to add channel IDs: " + e.getMessage()
            ));
        }
    }
    
    /**
     * List all highlight sources with their channel ID status.
     * Useful for debugging which sources need channel IDs.
     */
    @GetMapping("/list-sources")
    @Operation(
        summary = "List all highlight sources",
        description = "Shows all sources with their channel ID status for debugging"
    )
    public ResponseEntity<List<Map<String, Object>>> listSources() {
        log.info("Admin endpoint called: list-sources");
        
        try {
            var sources = channelInfoBackfillService.listAllSources();
            return ResponseEntity.ok(sources);
        } catch (Exception e) {
            log.error("Failed to list sources: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(List.of());
        }
    }
}
