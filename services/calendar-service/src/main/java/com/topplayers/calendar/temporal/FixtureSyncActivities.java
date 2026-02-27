package com.topplayers.calendar.temporal;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.time.LocalDate;

/**
 * Fixture Sync Activities Interface
 * Defines activities for Temporal workflow
 */
@ActivityInterface
public interface FixtureSyncActivities {

    /**
     * Sync fixtures for a specific date
     */
    @ActivityMethod
    void syncFixturesForDate(LocalDate date);

    /**
     * Update live fixtures
     */
    @ActivityMethod
    void updateLiveFixtures();

    /**
     * Cleanup old fixtures
     */
    @ActivityMethod
    void cleanupOldFixtures(int daysToKeep);
}
