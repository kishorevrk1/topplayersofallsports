package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.dto.BatchRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.BatchRegistrationResponse;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import com.topplayersofallsports.playerservice.temporal.activity.BatchRegistrationActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Async;
import io.temporal.workflow.Promise;
import io.temporal.workflow.Workflow;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
public class BatchPlayerRegistrationWorkflowImpl implements BatchPlayerRegistrationWorkflow {
    
    private static final int BATCH_SIZE = 25; // Process 25 players at a time
    
    // Activities with retry policy
    private final BatchRegistrationActivities batchActivities = Workflow.newActivityStub(
        BatchRegistrationActivities.class,
        ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(10))
            .setRetryOptions(RetryOptions.newBuilder()
                .setMaximumAttempts(3)
                .setBackoffCoefficient(2.0)
                .build())
            .build()
    );
    
    @Override
    public BatchRegistrationResponse registerBatchPlayers(BatchRegistrationRequest request) {
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("Starting batch player registration for {} - Count: {}", 
                request.getSport(), request.getCount());
        
        try {
            // Step 1: Check if batch registration can start
            boolean canStart = batchActivities.canStartBatchRegistration(request.getSport().name());
            if (!canStart) {
                return BatchRegistrationResponse.builder()
                    .status("FAILED")
                    .sport(request.getSport().name())
                    .message("Batch registration cannot start - another batch may be running")
                    .startedAt(startTime)
                    .completedAt(LocalDateTime.now())
                    .build();
            }
            
            // Step 2: Get player list (from AI or provided list)
            List<String> playerNames;
            if (request.getPlayerNames() != null && !request.getPlayerNames().isEmpty()) {
                log.info("Using provided player list: {} players", request.getPlayerNames().size());
                playerNames = request.getPlayerNames();
            } else {
                log.info("Generating player list with AI for {} (count: {})", 
                        request.getSport(), request.getCount());
                playerNames = batchActivities.generateTopPlayersList(
                    request.getSport().name(),
                    request.getCount(),
                    request.getSource() != null ? request.getSource() : "AI_GENERATED"
                );
            }
            
            // Step 3: Filter out existing players (if enabled)
            List<String> playersToRegister;
            int skippedCount = 0;
            
            if (request.isSkipExisting()) {
                playersToRegister = batchActivities.filterExistingPlayers(
                    playerNames, 
                    request.getSport().name()
                );
                skippedCount = playerNames.size() - playersToRegister.size();
                log.info("Filtered players: {} new, {} already exist", 
                        playersToRegister.size(), skippedCount);
            } else {
                playersToRegister = playerNames;
            }
            
            // Step 4: Register players in batches using child workflows
            List<String> registeredPlayers = new ArrayList<>();
            List<String> failedPlayers = new ArrayList<>();
            int processed = 0;
            
            for (int i = 0; i < playersToRegister.size(); i += BATCH_SIZE) {
                int end = Math.min(i + BATCH_SIZE, playersToRegister.size());
                List<String> batch = playersToRegister.subList(i, end);
                
                log.info("Processing batch {}/{}: {} players", 
                        (i / BATCH_SIZE) + 1, 
                        (playersToRegister.size() / BATCH_SIZE) + 1,
                        batch.size());
                
                // Launch child workflows for this batch
                List<Promise<PlayerRegistrationResponse>> promises = new ArrayList<>();
                
                for (String playerName : batch) {
                    PlayerRegistrationWorkflow childWorkflow = Workflow.newChildWorkflowStub(
                        PlayerRegistrationWorkflow.class
                    );
                    
                    Promise<PlayerRegistrationResponse> promise = Async.function(
                        childWorkflow::registerPlayer,
                        PlayerRegistrationRequest.builder()
                            .playerName(playerName)
                            .sport(request.getSport().name())
                            .build()
                    );
                    
                    promises.add(promise);
                }
                
                // Wait for all promises in this batch to complete
                Promise.allOf(promises).get();
                
                // Collect results
                for (int j = 0; j < promises.size(); j++) {
                    PlayerRegistrationResponse response = promises.get(j).get();
                    if (response.isSuccess()) {
                        registeredPlayers.add(batch.get(j));
                    } else {
                        failedPlayers.add(batch.get(j));
                    }
                }
                
                processed += batch.size();
                log.info("Batch progress: {}/{} players processed", processed, playersToRegister.size());
            }
            
            // Build response
            LocalDateTime endTime = LocalDateTime.now();
            
            return BatchRegistrationResponse.builder()
                .status("COMPLETED")
                .sport(request.getSport().name())
                .totalPlayers(playerNames.size())
                .registered(registeredPlayers.size())
                .skipped(skippedCount)
                .failed(failedPlayers.size())
                .registeredPlayers(registeredPlayers)
                .failedPlayers(failedPlayers)
                .startedAt(startTime)
                .completedAt(endTime)
                .message(String.format("Batch registration completed: %d registered, %d skipped, %d failed",
                        registeredPlayers.size(), skippedCount, failedPlayers.size()))
                .build();
                
        } catch (Exception e) {
            log.error("Batch registration failed: {}", e.getMessage(), e);
            return BatchRegistrationResponse.builder()
                .status("FAILED")
                .sport(request.getSport().name())
                .message("Batch registration failed")
                .errorMessage(e.getMessage())
                .startedAt(startTime)
                .completedAt(LocalDateTime.now())
                .build();
        }
    }
}
