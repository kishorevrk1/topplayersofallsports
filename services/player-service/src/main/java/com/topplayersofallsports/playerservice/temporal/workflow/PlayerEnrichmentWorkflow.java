package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Temporal Workflow for enriching player data with missing fields
 * Uses AI to populate height, weight, birthdate, birthplace, photo, etc.
 * Note: Temporal allows only ONE @WorkflowMethod per interface
 */
@WorkflowInterface
public interface PlayerEnrichmentWorkflow {
    
    /**
     * Enrich all players with missing data using AI
     */
    @WorkflowMethod
    EnrichmentResult enrichAllPlayers();
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class EnrichmentResult implements Serializable {
        private boolean success;
        private int playersProcessed;
        private int playersEnriched;
        private int playersFailed;
        private String message;
        private long durationSeconds;
    }
}
