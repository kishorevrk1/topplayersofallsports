package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal Workflow for Player Rating Updates
 * Handles scheduled and on-demand player re-analysis
 */
@WorkflowInterface
public interface PlayerUpdateWorkflow {
    
    /**
     * Update a single player's rating based on latest data
     * @param playerId Database ID of player to update
     * @return UpdateResult with new rating and changes
     */
    @WorkflowMethod(name = "updateSinglePlayerRating")
    PlayerUpdateResult updatePlayerRating(Long playerId);
    
    /**
     * Batch update multiple players
     * @param playerIds List of player IDs to update
     * @return Batch results
     */
    @WorkflowMethod(name = "batchUpdatePlayerRatings")
    BatchUpdateResult batchUpdatePlayers(java.util.List<Long> playerIds);
}
