package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal workflow for monthly ACR (AI Consensus Rating) refresh.
 *
 * Triggered on the 1st of every month at 2 AM by PlayerSyncScheduler.
 * Finds all players with stale consensus ratings and re-evaluates them
 * in batches of 5, with a 12-second delay between batches to respect
 * OpenRouter free-tier rate limits.
 */
@WorkflowInterface
public interface MonthlyRatingRefreshWorkflow {

    @WorkflowMethod
    MonthlyRatingRefreshResult refreshStaleRatings();

    record MonthlyRatingRefreshResult(
        int playersFound,
        int playersRefreshed,
        int playersFailed,
        long durationSeconds,
        String message
    ) {}
}
