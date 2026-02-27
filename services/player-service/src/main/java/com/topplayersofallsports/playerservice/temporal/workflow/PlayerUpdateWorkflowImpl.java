package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.PlayerUpdateActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of Player Update Workflow
 * Re-fetches data and re-analyzes player ratings
 */
public class PlayerUpdateWorkflowImpl implements PlayerUpdateWorkflow {
    
    private static final Logger log = Workflow.getLogger(PlayerUpdateWorkflowImpl.class);
    
    // Activity options with retry for external calls
    private final ActivityOptions activityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofMinutes(2))
        .setRetryOptions(RetryOptions.newBuilder()
            .setInitialInterval(Duration.ofSeconds(5))
            .setMaximumInterval(Duration.ofMinutes(2))
            .setBackoffCoefficient(2.0)
            .setMaximumAttempts(3)
            .build())
        .build();
    
    private final PlayerUpdateActivities activities = 
        Workflow.newActivityStub(PlayerUpdateActivities.class, activityOptions);
    
    @Override
    public PlayerUpdateResult updatePlayerRating(Long playerId) {
        log.info("Starting rating update workflow for player ID: {}", playerId);
        
        try {
            // Step 1: Fetch current player data from database
            log.info("Step 1: Fetching current player data");
            PlayerUpdateResult currentData = activities.fetchCurrentPlayerData(playerId);
            
            if (currentData == null || !currentData.isSuccess()) {
                log.warn("Player not found: {}", playerId);
                return PlayerUpdateResult.builder()
                    .playerId(playerId)
                    .success(false)
                    .message("Player not found")
                    .build();
            }
            
            Integer oldRating = currentData.getOldRating();
            log.info("Current rating: {}/100 for {}", oldRating, currentData.getPlayerName());
            
            // Step 2: Fetch latest stats from API-Sports
            log.info("Step 2: Fetching latest stats from API");
            String latestStats = activities.fetchLatestPlayerStats(playerId);
            
            if (latestStats == null || latestStats.isEmpty()) {
                log.warn("No updated stats available for player {}", playerId);
                return PlayerUpdateResult.builder()
                    .playerId(playerId)
                    .playerName(currentData.getPlayerName())
                    .success(false)
                    .message("No updated stats available")
                    .build();
            }
            
            // Step 3: Re-analyze with AI based on latest data
            log.info("Step 3: Re-analyzing player with AI");
            String aiAnalysis = activities.reAnalyzePlayerWithAI(
                currentData.getPlayerName(),
                latestStats,
                oldRating
            );
            
            // Step 4: Update database with new rating
            log.info("Step 4: Updating database");
            PlayerUpdateResult result = activities.updatePlayerRating(
                playerId,
                aiAnalysis,
                latestStats
            );
            
            Integer newRating = result.getNewRating();
            Integer change = newRating - oldRating;
            
            log.info("Rating updated: {} → {} ({}{}) for {}", 
                oldRating, newRating, change > 0 ? "+" : "", change, result.getPlayerName());
            
            result.setOldRating(oldRating);
            result.setRatingChange(change);
            result.setUpdatedAt(LocalDateTime.now());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error updating player rating: {}", e.getMessage(), e);
            return PlayerUpdateResult.builder()
                .playerId(playerId)
                .success(false)
                .message("Update failed: " + e.getMessage())
                .build();
        }
    }
    
    @Override
    public BatchUpdateResult batchUpdatePlayers(List<Long> playerIds) {
        log.info("Starting batch update for {} players", playerIds.size());
        
        List<PlayerUpdateResult> results = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;
        
        for (Long playerId : playerIds) {
            try {
                PlayerUpdateResult result = updatePlayerRating(playerId);
                results.add(result);
                
                if (result.isSuccess()) {
                    successCount++;
                } else {
                    failureCount++;
                }
                
                // Small delay between updates to avoid rate limits
                Workflow.sleep(Duration.ofSeconds(2));
                
            } catch (Exception e) {
                log.error("Failed to update player {}: {}", playerId, e.getMessage());
                failureCount++;
                results.add(PlayerUpdateResult.builder()
                    .playerId(playerId)
                    .success(false)
                    .message(e.getMessage())
                    .build());
            }
        }
        
        String summary = String.format(
            "Batch update completed: %d/%d successful, %d failed",
            successCount, playerIds.size(), failureCount
        );
        
        log.info(summary);
        
        return BatchUpdateResult.builder()
            .totalPlayers(playerIds.size())
            .successCount(successCount)
            .failureCount(failureCount)
            .results(results)
            .summary(summary)
            .completedAt(LocalDateTime.now())
            .build();
    }
}
