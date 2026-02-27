package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.dto.BatchRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.BatchRegistrationResponse;
import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface BatchPlayerRegistrationWorkflow {
    
    @WorkflowMethod
    BatchRegistrationResponse registerBatchPlayers(BatchRegistrationRequest request);
}
