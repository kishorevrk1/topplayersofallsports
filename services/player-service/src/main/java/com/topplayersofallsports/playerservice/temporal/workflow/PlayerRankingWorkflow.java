package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.entity.Sport;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal workflow for initializing the top-50 ranking for a single sport.
 *
 * Temporal rule: exactly ONE @WorkflowMethod per @WorkflowInterface.
 * Other entry points (all-sports, monthly update) live in their own interfaces:
 *   - AllSportsRankingWorkflow  → initializeAllSports()
 */
@WorkflowInterface
public interface PlayerRankingWorkflow {

    /** Initialize top 50 players for a single sport. */
    @WorkflowMethod
    RankingWorkflowResult initializeTop50(Sport sport);
    
    // DTOs
    
    record RankingWorkflowResult(
        Sport sport,
        boolean success,
        int playersProcessed,
        String message,
        long durationSeconds
    ) {}
    
    record AllSportsRankingResult(
        int totalSports,
        int successfulSports,
        int failedSports,
        java.util.Map<Sport, RankingWorkflowResult> results,
        long totalDurationSeconds
    ) {}
}
