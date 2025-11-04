package com.topplayersofallsports.highlights.temporal;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;

/**
 * Temporal workflow implementation for highlight ingestion.
 * 
 * Orchestrates the process of fetching, enriching, and storing video highlights.
 * Provides durability, automatic retries, and fault tolerance.
 * 
 * Production-ready with proper activity options and error handling.
 */
public class HighlightIngestWorkflowImpl implements HighlightIngestWorkflow {

    private static final Logger log = Workflow.getLogger(HighlightIngestWorkflowImpl.class);

    // Activity options with retries and timeouts
    private final ActivityOptions activityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofMinutes(10))
        .setRetryOptions(
            io.temporal.common.RetryOptions.newBuilder()
                .setInitialInterval(Duration.ofSeconds(1))
                .setMaximumInterval(Duration.ofSeconds(30))
                .setBackoffCoefficient(2.0)
                .setMaximumAttempts(3)
                .build()
        )
        .build();

    private final HighlightIngestActivities activities = 
        Workflow.newActivityStub(HighlightIngestActivities.class, activityOptions);

    @Override
    public int ingestFromSource(Long sourceId) {
        log.info("🚀 Starting ingest workflow for source: {}", sourceId);
        
        try {
            // Step 1: Fetch source details
            log.info("Step 1: Fetching source details for id: {}", sourceId);
            var sourceDetails = activities.fetchSourceDetails(sourceId);
            
            if (sourceDetails == null) {
                log.warn("Source {} not found or inactive, skipping ingest", sourceId);
                return 0;
            }
            
            log.info("Source details fetched: {} (type: {})", 
                sourceDetails.name(), sourceDetails.type());
            
            // Step 2: Fetch video IDs from YouTube
            log.info("Step 2: Fetching video IDs from YouTube");
            var videoIds = activities.fetchVideoIdsFromSource(sourceDetails);
            
            if (videoIds.isEmpty()) {
                log.info("No new videos found for source: {}", sourceId);
                return 0;
            }
            
            log.info("Found {} video IDs to process", videoIds.size());
            
            // Step 3: Fetch and enrich video details
            log.info("Step 3: Fetching video details from YouTube");
            var videoDetails = activities.fetchVideoDetails(videoIds);
            
            log.info("Fetched details for {} videos", videoDetails.size());
            
            // Step 4: Map and save highlights
            log.info("Step 4: Mapping and saving highlights");
            int savedCount = activities.saveHighlights(videoDetails, sourceId);
            
            log.info("Saved {} highlights", savedCount);
            
            // Step 5: Mark source as ingested
            log.info("Step 5: Marking source as ingested");
            activities.markSourceAsIngested(sourceId);
            
            log.info("✅ Ingest workflow completed successfully for source: {}. Saved {} highlights", 
                sourceId, savedCount);
            
            return savedCount;
            
        } catch (Exception e) {
            log.error("❌ Ingest workflow failed for source: {}", sourceId, e);
            throw e;
        }
    }
}
