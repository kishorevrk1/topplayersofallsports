package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.dto.PlayerRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal Workflow for Player Registration
 * Orchestrates the complete player registration process with AI calls
 */
@WorkflowInterface
public interface PlayerRegistrationWorkflow {
    
    /**
     * Main workflow method to register a player
     * This is a long-running workflow that includes AI calls and API interactions
     */
    @WorkflowMethod
    PlayerRegistrationResponse registerPlayer(PlayerRegistrationRequest request);
}
