package com.topplayers.calendar.temporal;

import com.topplayers.calendar.service.FixtureService;
import io.temporal.spring.boot.ActivityImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Fixture Sync Activities Implementation
 * Implements Temporal activities for fixture syncing
 */
@Component
@ActivityImpl(taskQueues = "calendar-service-tasks")
@RequiredArgsConstructor
@Slf4j
public class FixtureSyncActivitiesImpl implements FixtureSyncActivities {

    private final FixtureService fixtureService;

    @Override
    public void syncFixturesForDate(LocalDate date) {
        log.info("[Activity] Syncing fixtures for date: {}", date);
        try {
            fixtureService.syncFixturesForDate(date);
            log.info("[Activity] Successfully synced fixtures for {}", date);
        } catch (Exception e) {
            log.error("[Activity] Error syncing fixtures for {}: {}", date, e.getMessage());
            throw e;
        }
    }

    @Override
    public void updateLiveFixtures() {
        log.info("[Activity] Updating live fixtures");
        try {
            fixtureService.updateLiveFixtures();
            log.info("[Activity] Successfully updated live fixtures");
        } catch (Exception e) {
            log.error("[Activity] Error updating live fixtures: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public void cleanupOldFixtures(int daysToKeep) {
        log.info("[Activity] Cleaning up old fixtures (keeping last {} days)", daysToKeep);
        try {
            // This would call a cleanup method in FixtureService
            // For now, we'll just log
            log.info("[Activity] Cleanup completed (not implemented yet)");
        } catch (Exception e) {
            log.error("[Activity] Error cleaning up old fixtures: {}", e.getMessage());
            throw e;
        }
    }
}
