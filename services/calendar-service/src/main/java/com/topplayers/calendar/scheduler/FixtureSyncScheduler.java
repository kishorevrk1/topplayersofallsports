package com.topplayers.calendar.scheduler;

import com.topplayers.calendar.config.TemporalConfig;
import com.topplayers.calendar.service.FixtureService;
import com.topplayers.calendar.temporal.FixtureSyncWorkflow;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Fixture Sync Scheduler
 * Schedules automated fixture syncing using Temporal workflows
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FixtureSyncScheduler {

    private final TemporalConfig temporalConfig;
    private final FixtureService fixtureService;
    private final com.topplayers.calendar.service.BasketballService basketballService;

    /**
     * Daily fixture sync - DISABLED for free plan
     * 
     * Free plan strategy: Live-First experience
     * - Only live matches (no historical, no future syncs)
     * - Conserves API calls (100/day limit)
     * - Enable this when upgrading to premium plan
     */
    // @Scheduled(cron = "${temporal.workflows.sync-schedule:0 0 2 * * ?}")
    public void scheduleDailySync() {
        log.debug("Daily sync disabled for free plan - Live-First strategy enabled");
        
        // PREMIUM FEATURE: Uncomment when API plan upgraded
        // try {
        //     String workflowId = "fixture-sync-daily-" + System.currentTimeMillis();
        //     FixtureSyncWorkflow workflow = temporalConfig.getFixtureSyncWorkflow(workflowId);
        //     io.temporal.client.WorkflowClient.start(workflow::syncFixturesDaily, 7);
        //     log.info("Daily fixture sync workflow started: {}", workflowId);
        // } catch (Exception e) {
        //     log.error("Error starting daily sync workflow: {}", e.getMessage(), e);
        // }
    }

    private boolean updateFootballNext = true;

    /**
     * Live fixture updates - runs every 15 seconds
     * Alternates between football and basketball to conserve API calls
     * (100 calls/day limit = ~4 calls/hour per sport)
     */
    @Scheduled(fixedDelayString = "${temporal.workflows.live-update-interval:15}000")
    public void scheduleLiveUpdates() {
        try {
            // Alternate between sports to stay under API limit
            // Football: 15s, Basketball: 15s, Football: 15s, etc.
            if (updateFootballNext) {
                fixtureService.updateLiveFixtures();
                log.debug("Updated football fixtures");
            } else {
                basketballService.updateLiveGames();
                log.debug("Updated basketball games");
            }
            
            // Toggle for next update
            updateFootballNext = !updateFootballNext;
        } catch (Exception e) {
            log.error("Error updating live fixtures: {}", e.getMessage());
        }
    }

    /**
     * Initial sync on application startup
     * 
     * Free plan: Disabled to conserve API calls
     * Live updates scheduler will start automatically
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Application ready - Live-First mode enabled");
        log.info("Live fixture updates will start automatically every 15 seconds");
        log.info("API Budget: ~60-80 calls/day for live matches (100/day limit)");
        
        // DISABLED: Initial sync consumes API calls unnecessarily
        // Live updates scheduler will populate data naturally
        
        // NOTE: We keep all historical match data for users to browse
        // No cleanup of old matches - data is valuable!
    }
}
