package com.topplayers.calendar.temporal;

import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.LocalDate;

/**
 * Fixture Sync Workflow Implementation
 * Orchestrates daily fixture syncing and live updates
 */
@Slf4j
public class FixtureSyncWorkflowImpl implements FixtureSyncWorkflow {

    private final FixtureSyncActivities activities;

    public FixtureSyncWorkflowImpl() {
        this.activities = Workflow.newActivityStub(
                FixtureSyncActivities.class,
                ActivityOptions.newBuilder()
                        .setStartToCloseTimeout(Duration.ofMinutes(10))
                        .setRetryOptions(io.temporal.common.RetryOptions.newBuilder()
                                .setMaximumAttempts(3)
                                .setInitialInterval(Duration.ofSeconds(1))
                                .setMaximumInterval(Duration.ofSeconds(10))
                                .build())
                        .build()
        );
    }

    @Override
    public void syncFixturesDaily(int daysAhead) {
        Workflow.getLogger(FixtureSyncWorkflowImpl.class)
                .info("Starting daily fixture sync for next {} days", daysAhead);

        LocalDate today = LocalDate.now();

        // Sync fixtures for the next N days
        for (int i = 0; i < daysAhead; i++) {
            LocalDate targetDate = today.plusDays(i);
            
            try {
                activities.syncFixturesForDate(targetDate);
                Workflow.sleep(Duration.ofSeconds(2)); // Rate limiting delay
            } catch (Exception e) {
                Workflow.getLogger(FixtureSyncWorkflowImpl.class)
                        .error("Error syncing fixtures for {}: {}", targetDate, e.getMessage());
            }
        }

        // Update live fixtures
        try {
            activities.updateLiveFixtures();
        } catch (Exception e) {
            Workflow.getLogger(FixtureSyncWorkflowImpl.class)
                    .error("Error updating live fixtures: {}", e.getMessage());
        }

        // Cleanup old fixtures (keep last 30 days)
        try {
            activities.cleanupOldFixtures(30);
        } catch (Exception e) {
            Workflow.getLogger(FixtureSyncWorkflowImpl.class)
                    .error("Error cleaning up old fixtures: {}", e.getMessage());
        }

        Workflow.getLogger(FixtureSyncWorkflowImpl.class)
                .info("Daily fixture sync completed");
    }
}
