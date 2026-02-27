package com.topplayers.calendar.temporal;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Fixture Sync Workflow Interface
 * Defines Temporal workflow for syncing fixtures
 */
@WorkflowInterface
public interface FixtureSyncWorkflow {

    /**
     * Sync fixtures for next N days
     * Main workflow method
     */
    @WorkflowMethod
    void syncFixturesDaily(int daysAhead);
}
