package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.dto.PlayerRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import com.topplayersofallsports.playerservice.dto.ai.PlayerSearchResult;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRegistrationActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;

/**
 * Implementation of Player Registration Workflow
 * Handles the complete orchestration with fault tolerance
 */
public class PlayerRegistrationWorkflowImpl implements PlayerRegistrationWorkflow {
    
    private static final Logger log = Workflow.getLogger(PlayerRegistrationWorkflowImpl.class);
    
    // Activity options with retry policy for AI calls (handles 429 rate limits)
    private final ActivityOptions aiActivityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofMinutes(2))
        .setRetryOptions(RetryOptions.newBuilder()
            .setInitialInterval(Duration.ofSeconds(10))
            .setMaximumInterval(Duration.ofMinutes(5))
            .setBackoffCoefficient(2.0)
            .setMaximumAttempts(5)
            .build())
        .build();
    
    // Activity options for API calls (handles rate limits and network issues)
    private final ActivityOptions apiActivityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofMinutes(1))
        .setRetryOptions(RetryOptions.newBuilder()
            .setInitialInterval(Duration.ofSeconds(5))
            .setMaximumInterval(Duration.ofMinutes(2))
            .setBackoffCoefficient(2.0)
            .setMaximumAttempts(3)
            .build())
        .build();
    
    // Activity options for DB operations (fast, minimal retries)
    private final ActivityOptions dbActivityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofSeconds(30))
        .setRetryOptions(RetryOptions.newBuilder()
            .setInitialInterval(Duration.ofSeconds(1))
            .setMaximumInterval(Duration.ofSeconds(10))
            .setBackoffCoefficient(1.5)
            .setMaximumAttempts(3)
            .build())
        .build();
    
    private final PlayerRegistrationActivities aiActivities = 
        Workflow.newActivityStub(PlayerRegistrationActivities.class, aiActivityOptions);
    
    private final PlayerRegistrationActivities apiActivities = 
        Workflow.newActivityStub(PlayerRegistrationActivities.class, apiActivityOptions);
    
    private final PlayerRegistrationActivities dbActivities = 
        Workflow.newActivityStub(PlayerRegistrationActivities.class, dbActivityOptions);
    
    @Override
    public PlayerRegistrationResponse registerPlayer(PlayerRegistrationRequest request) {
        log.info("Starting player registration workflow for: {}", request.getPlayerName());
        
        try {
            // Step 1: AI Search - Validate and identify player
            log.info("Step 1: Searching for player with AI...");
            PlayerSearchResult searchResult = aiActivities.searchPlayerWithAI(
                request.getPlayerName(),
                request.getSport(),
                buildHints(request)
            );
            
            if (!searchResult.isActivePlayer()) {
                log.warn("Player not found or inactive: {}", request.getPlayerName());
                return PlayerRegistrationResponse.builder()
                    .success(false)
                    .status("FAILED")
                    .message("Player not found or unable to validate")
                    .errorMessage(searchResult.getCareerSummary())
                    .build();
            }
            
            log.info("Found player: {} - {} ({})", 
                searchResult.getFullName(), 
                searchResult.getSport(), 
                searchResult.getCurrentTeam());
            
            // Step 2: Check if player already exists in DB
            log.info("Step 2: Checking for existing player...");
            PlayerRegistrationResponse existingCheck = dbActivities.checkExistingPlayer(
                searchResult.getFullName()
            );
            
            if (existingCheck != null && existingCheck.isSuccess()) {
                log.info("Player already exists with ID: {}", existingCheck.getPlayerId());
                return existingCheck;
            }
            
            // Step 3: AI-Only Approach - No API-Sports needed!
            log.info("Step 3: Using AI-only approach for complete player data");
            String playerData = "{}"; // AI will generate everything
            
            // Step 4: AI generates complete player profile, rating, and analysis
            log.info("Step 4: Generating AI analysis and rating...");
            String aiAnalysis = aiActivities.generateAIAnalysis(
                searchResult.getFullName(),
                playerData,
                searchResult.getSport()
            );
            
            // Step 5: Save complete player profile to database
            log.info("Step 5: Saving player to database...");
            PlayerRegistrationResponse response = dbActivities.savePlayerProfile(
                searchResult,
                playerData,
                aiAnalysis
            );
            
            log.info("Player registration workflow completed successfully for: {}", 
                request.getPlayerName());
            
            return response;
            
        } catch (Exception e) {
            log.error("Player registration workflow failed: {}", e.getMessage(), e);
            return PlayerRegistrationResponse.builder()
                .success(false)
                .status("FAILED")
                .message("Error during player registration")
                .errorMessage(e.getMessage())
                .build();
        }
    }
    
    private String buildHints(PlayerRegistrationRequest request) {
        StringBuilder hints = new StringBuilder();
        if (request.getTeam() != null && !request.getTeam().isBlank()) {
            hints.append("Team: ").append(request.getTeam()).append(". ");
        }
        if (request.getNationality() != null && !request.getNationality().isBlank()) {
            hints.append("Nationality: ").append(request.getNationality()).append(". ");
        }
        if (request.getAdditionalInfo() != null && !request.getAdditionalInfo().isBlank()) {
            hints.append(request.getAdditionalInfo());
        }
        return hints.toString();
    }
}
