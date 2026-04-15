package com.topplayersofallsports.highlights.config;

import com.topplayersofallsports.highlights.temporal.HighlightIngestActivitiesImpl;
import com.topplayersofallsports.highlights.temporal.HighlightIngestWorkflowImpl;
import io.temporal.worker.Worker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * Configuration for registering Temporal workflows and activities with workers.
 *
 * Ensures workflows and activities are properly registered before workers start.
 * This configuration is skipped if temporal.enabled=false
 */
@Configuration
@ConditionalOnProperty(name = "temporal.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class TemporalWorkerConfig {

    private final Worker highlightIngestWorker;
    private final HighlightIngestActivitiesImpl activities;

    @PostConstruct
    public void registerWorkflowsAndActivities() {
        log.info("Registering Temporal workflows and activities");
        
        // Register workflow implementation
        highlightIngestWorker.registerWorkflowImplementationTypes(
            HighlightIngestWorkflowImpl.class
        );
        
        // Register activity implementation
        highlightIngestWorker.registerActivitiesImplementations(activities);
        
        log.info("✅ Temporal workflows and activities registered successfully");
    }
}
