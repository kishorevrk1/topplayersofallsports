package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.BatchRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.BatchRegistrationResponse;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import com.topplayersofallsports.playerservice.temporal.workflow.BatchPlayerRegistrationWorkflow;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerRegistrationWorkflow;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.temporal.api.enums.v1.WorkflowExecutionStatus;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.client.WorkflowStub;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for Temporal-based Player Registration
 * Provides resilient, fault-tolerant player registration with automatic retry
 * 
 * NOTE: This controller is only loaded when temporal.enabled=true
 */
@RestController
@RequestMapping("/api/players/temporal")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Temporal Player Registration", description = "Fault-tolerant player registration using Temporal workflows")
@ConditionalOnProperty(name = "temporal.enabled", havingValue = "true")
public class TemporalPlayerController {
    
    private final WorkflowClient workflowClient;
    
    @PostMapping("/register")
    @Operation(summary = "Register player using Temporal workflow (async)", 
               description = "Starts a resilient workflow that handles rate limits and retries automatically")
    public ResponseEntity<Map<String, Object>> registerPlayerAsync(
            @RequestBody PlayerRegistrationRequest request) {
        
        log.info("Starting Temporal workflow for player: {}", request.getPlayerName());
        
        try {
            String workflowId = "player-reg-" + UUID.randomUUID().toString();
            
            // Create workflow options
            WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("player-registration")
                .setWorkflowId(workflowId)
                .build();
            
            // Create workflow stub
            PlayerRegistrationWorkflow workflow = workflowClient.newWorkflowStub(
                PlayerRegistrationWorkflow.class, 
                options
            );
            
            // Start workflow asynchronously
            WorkflowClient.start(workflow::registerPlayer, request);
            
            log.info("Workflow started with ID: {}", workflowId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("workflowId", workflowId);
            response.put("status", "STARTED");
            response.put("message", "Player registration workflow started. Check status with workflow ID.");
            response.put("playerName", request.getPlayerName());
            response.put("statusEndpoint", "/api/players/temporal/status/" + workflowId);
            
            return ResponseEntity.accepted().body(response);
            
        } catch (Exception e) {
            log.error("Failed to start workflow: {}", e.getMessage(), e);
            
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to start workflow");
            error.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PostMapping("/register-sync")
    @Operation(summary = "Register player using Temporal workflow (sync)", 
               description = "Waits for workflow completion. May take minutes if rate limits are hit.")
    public ResponseEntity<PlayerRegistrationResponse> registerPlayerSync(
            @RequestBody PlayerRegistrationRequest request) {
        
        log.info("Starting synchronous Temporal workflow for player: {}", request.getPlayerName());
        
        try {
            String workflowId = "player-reg-sync-" + UUID.randomUUID().toString();
            
            WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("player-registration")
                .setWorkflowId(workflowId)
                .build();
            
            PlayerRegistrationWorkflow workflow = workflowClient.newWorkflowStub(
                PlayerRegistrationWorkflow.class, 
                options
            );
            
            // Execute synchronously (blocks until complete)
            log.info("Executing workflow synchronously (this may take time)...");
            PlayerRegistrationResponse result = workflow.registerPlayer(request);
            
            log.info("Workflow completed: {}", result.getStatus());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Workflow execution failed: {}", e.getMessage(), e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(PlayerRegistrationResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("Workflow execution error")
                    .errorMessage(e.getMessage())
                    .build());
        }
    }
    
    /**
     * Batch register multiple players at once using AI-generated list
     */
    @PostMapping("/batch-register")
    @Operation(summary = "Batch register players", 
               description = "Register multiple players in parallel using AI to generate the player list")
    public ResponseEntity<Map<String, String>> registerBatchPlayers(
            @RequestBody BatchRegistrationRequest request) {
        
        String workflowId = "batch-reg-" + UUID.randomUUID();
        log.info("Starting batch player registration for {} - Count: {}, WorkflowId: {}", 
                request.getSport(), request.getCount(), workflowId);
        
        try {
            WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("player-registration")
                .setWorkflowId(workflowId)
                .setWorkflowRunTimeout(Duration.ofHours(2)) // Batch can take a while
                .build();
            
            BatchPlayerRegistrationWorkflow workflow = 
                workflowClient.newWorkflowStub(BatchPlayerRegistrationWorkflow.class, options);
            
            // Start async
            WorkflowClient.start(workflow::registerBatchPlayers, request);
            
            Map<String, String> response = new HashMap<>();
            response.put("workflowId", workflowId);
            response.put("status", "STARTED");
            response.put("sport", request.getSport().name());
            response.put("count", String.valueOf(request.getCount()));
            response.put("message", "Batch registration started");
            response.put("statusEndpoint", "/api/players/temporal/batch-status/" + workflowId);
            response.put("resultEndpoint", "/api/players/temporal/batch-result/" + workflowId);
            
            return ResponseEntity.accepted().body(response);
            
        } catch (Exception e) {
            log.error("Failed to start batch registration: {}", e.getMessage(), e);
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "FAILED");
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get batch registration result (blocking)
     */
    @GetMapping("/batch-result/{workflowId}")
    @Operation(summary = "Get batch registration result")
    public ResponseEntity<BatchRegistrationResponse> getBatchResult(@PathVariable String workflowId) {
        log.info("Getting batch result for workflow: {}", workflowId);
        
        try {
            WorkflowStub workflowStub = workflowClient.newUntypedWorkflowStub(workflowId);
            BatchRegistrationResponse result = workflowStub.getResult(BatchRegistrationResponse.class);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to get batch result for {}: {}", workflowId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                BatchRegistrationResponse.builder()
                    .status("FAILED")
                    .message("Could not retrieve batch result")
                    .errorMessage(e.getMessage())
                    .build()
            );
        }
    }
    
    @GetMapping("/status/{workflowId}")
    @Operation(summary = "Check workflow status", 
               description = "Get current status of a player registration workflow")
    public ResponseEntity<Map<String, Object>> getWorkflowStatus(
            @PathVariable String workflowId) {
        
        log.info("Checking status for workflow: {}", workflowId);
        
        try {
            // Create untyped workflow stub
            WorkflowStub workflow = workflowClient.newUntypedWorkflowStub(workflowId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("workflowId", workflowId);
            response.put("status", "RUNNING");
            response.put("description", "Workflow is in progress. Use /result endpoint to wait for completion.");
            
            // Try to get result (non-blocking check)
            try {
                if (workflow.getResult(0, java.util.concurrent.TimeUnit.MILLISECONDS, Void.class) != null) {
                    response.put("status", "COMPLETED");
                    response.put("description", "Workflow completed successfully");
                    
                    PlayerRegistrationResponse result = workflow.getResult(PlayerRegistrationResponse.class);
                    response.put("result", result);
                }
            } catch (java.util.concurrent.TimeoutException e) {
                // Still running
                response.put("status", "RUNNING");
            } catch (Exception e) {
                // Failed or other error
                response.put("status", "ERROR");
                response.put("description", "Workflow failed: " + e.getMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to get workflow status: {}", e.getMessage(), e);
            
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Workflow not found or error retrieving status");
            error.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
    
    @GetMapping("/result/{workflowId}")
    @Operation(summary = "Get workflow result", 
               description = "Get the final result of a completed workflow")
    public ResponseEntity<PlayerRegistrationResponse> getWorkflowResult(
            @PathVariable String workflowId) {
        
        log.info("Getting result for workflow: {}", workflowId);
        
        try {
            WorkflowStub workflow = workflowClient.newUntypedWorkflowStub(workflowId);
            
            // This blocks until workflow completes
            PlayerRegistrationResponse result = workflow.getResult(PlayerRegistrationResponse.class);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Failed to get workflow result: {}", e.getMessage(), e);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(PlayerRegistrationResponse.builder()
                    .success(false)
                    .status("ERROR")
                    .message("Could not retrieve workflow result")
                    .errorMessage(e.getMessage())
                    .build());
        }
    }
    
    private String getStatusDescription(WorkflowExecutionStatus status) {
        return switch (status) {
            case WORKFLOW_EXECUTION_STATUS_RUNNING -> 
                "Workflow is currently running (AI search, API fetch, or analysis in progress)";
            case WORKFLOW_EXECUTION_STATUS_COMPLETED -> 
                "Workflow completed successfully";
            case WORKFLOW_EXECUTION_STATUS_FAILED -> 
                "Workflow failed after retries";
            case WORKFLOW_EXECUTION_STATUS_CANCELED -> 
                "Workflow was canceled";
            case WORKFLOW_EXECUTION_STATUS_TERMINATED -> 
                "Workflow was terminated";
            case WORKFLOW_EXECUTION_STATUS_CONTINUED_AS_NEW -> 
                "Workflow continued as new";
            case WORKFLOW_EXECUTION_STATUS_TIMED_OUT -> 
                "Workflow timed out";
            default -> "Unknown status";
        };
    }
}
