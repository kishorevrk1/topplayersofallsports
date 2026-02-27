package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.entity.Sport;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal workflow for player ranking operations
 * Note: Temporal allows only ONE @WorkflowMethod per interface
 */
@WorkflowInterface
public interface PlayerRankingWorkflow {
    
    /**
     * Initialize top 50 players for a single sport
     */
    @WorkflowMethod
    RankingWorkflowResult initializeTop50(Sport sport);
    
    /**
     * Initialize top 50 for all sports (use this as entry point for all sports)
     */
    AllSportsRankingResult initializeAllSports();
    
    /**
     * Monthly ranking update for a sport
     */
    RankingWorkflowResult updateMonthlyRankings(Sport sport);
    
    /**
     * Monthly ranking update for all sports
     */
    AllSportsRankingResult updateAllSportsMonthly();
    
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
