package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal workflow for initializing rankings for all sports
 */
@WorkflowInterface
public interface AllSportsRankingWorkflow {
    
    @WorkflowMethod
    PlayerRankingWorkflow.AllSportsRankingResult initializeAllSports();
}
