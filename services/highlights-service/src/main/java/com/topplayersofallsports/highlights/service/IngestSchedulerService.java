package com.topplayersofallsports.highlights.service;

import com.topplayersofallsports.highlights.domain.model.HighlightSource;
import com.topplayersofallsports.highlights.temporal.HighlightIngestWorkflow;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * Scheduler service for triggering Temporal ingest workflows.
 *
 * Periodically checks active sources and triggers ingest workflows based on priority.
 * Production-ready with proper workflow management and error handling.
 * NOTE: Only used when Temporal is enabled. Not loaded as a Spring bean by default.
 */
// @Service - commented out to avoid loading when Temporal is disabled
@RequiredArgsConstructor
@Slf4j
public class IngestSchedulerService {

    private final WorkflowClient workflowClient;
    private final HighlightSourceService sourceService;

    @Value("${temporal.worker.task-queue:highlights-ingest}")
    private String taskQueue;

    /**
     * Schedule ingest for all active sources.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 60000) // 5 minutes, start after 1 minute
    public void scheduleIngestForAllSources() {
        log.info("🔄 Starting scheduled ingest for all active sources");
        
        List<HighlightSource> activeSources = sourceService.findAllActiveOrderedByWeight();
        log.info("Found {} active sources to ingest", activeSources.size());
        
        for (HighlightSource source : activeSources) {
            try {
                scheduleIngestForSource(source);
            } catch (Exception e) {
                log.error("Failed to schedule ingest for source {}: {}", source.getId(), e.getMessage(), e);
            }
        }
        
        log.info("✅ Scheduled ingest completed for {} sources", activeSources.size());
    }

    /**
     * Schedule ingest workflow for a specific source.
     */
    public void scheduleIngestForSource(HighlightSource source) {
        String workflowId = "ingest-source-" + source.getId() + "-" + System.currentTimeMillis();
        
        log.debug("Scheduling ingest workflow for source: {} (id: {}, weight: {})", 
            source.getName(), source.getId(), source.getWeight());
        
        WorkflowOptions options = WorkflowOptions.newBuilder()
            .setWorkflowId(workflowId)
            .setTaskQueue(taskQueue)
            .setWorkflowExecutionTimeout(Duration.ofMinutes(30))
            .build();
        
        HighlightIngestWorkflow workflow = workflowClient.newWorkflowStub(
            HighlightIngestWorkflow.class, 
            options
        );
        
        // Start workflow asynchronously
        WorkflowClient.start(workflow::ingestFromSource, source.getId());
        
        log.debug("Started ingest workflow: {} for source: {}", workflowId, source.getName());
    }

    /**
     * Manually trigger ingest for a specific source.
     * Used for on-demand ingestion.
     */
    public String triggerManualIngest(Long sourceId) {
        log.info("🎯 Manual ingest triggered for source: {}", sourceId);
        
        // Verify source exists
        sourceService.findById(sourceId)
            .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourceId));
        
        String workflowId = "manual-ingest-source-" + sourceId + "-" + System.currentTimeMillis();
        
        WorkflowOptions options = WorkflowOptions.newBuilder()
            .setWorkflowId(workflowId)
            .setTaskQueue(taskQueue)
            .setWorkflowExecutionTimeout(Duration.ofMinutes(30))
            .build();
        
        HighlightIngestWorkflow workflow = workflowClient.newWorkflowStub(
            HighlightIngestWorkflow.class, 
            options
        );
        
        // Start workflow asynchronously
        WorkflowClient.start(workflow::ingestFromSource, sourceId);
        
        log.info("✅ Manual ingest workflow started: {}", workflowId);
        return workflowId;
    }
}
