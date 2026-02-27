package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal workflow for enriching players of a specific sport
 */
@WorkflowInterface
public interface SportEnrichmentWorkflow {
    
    @WorkflowMethod
    PlayerEnrichmentWorkflow.EnrichmentResult enrichSportPlayers(String sport);
}
