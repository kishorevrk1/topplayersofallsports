package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.PlayerEnrichmentActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;
import org.slf4j.Logger;

import java.time.Duration;
import java.util.List;

/**
 * Implementation of Player Enrichment Workflow
 * Orchestrates AI enrichment for players with missing data
 */
public class PlayerEnrichmentWorkflowImpl implements PlayerEnrichmentWorkflow, SportEnrichmentWorkflow {
    
    private static final Logger log = Workflow.getLogger(PlayerEnrichmentWorkflowImpl.class);
    
    // Activity options with retry policy for AI calls
    private final ActivityOptions activityOptions = ActivityOptions.newBuilder()
        .setStartToCloseTimeout(Duration.ofMinutes(2))
        .setRetryOptions(RetryOptions.newBuilder()
            .setInitialInterval(Duration.ofSeconds(10))
            .setMaximumInterval(Duration.ofMinutes(2))
            .setBackoffCoefficient(2.0)
            .setMaximumAttempts(3)
            .build())
        .build();
    
    private final PlayerEnrichmentActivities activities = 
        Workflow.newActivityStub(PlayerEnrichmentActivities.class, activityOptions);
    
    @Override
    public EnrichmentResult enrichAllPlayers() {
        long startTime = Workflow.currentTimeMillis();
        log.info("Starting enrichment workflow for ALL players");
        
        try {
            // Get all players with missing data
            List<Long> playerIds = activities.findPlayersWithMissingData(null);
            
            if (playerIds.isEmpty()) {
                log.info("No players found with missing data");
                return EnrichmentResult.builder()
                    .success(true)
                    .playersProcessed(0)
                    .playersEnriched(0)
                    .playersFailed(0)
                    .message("No players with missing data found")
                    .durationSeconds((Workflow.currentTimeMillis() - startTime) / 1000)
                    .build();
            }
            
            log.info("Found {} players with missing data", playerIds.size());
            
            int enriched = 0;
            int failed = 0;
            
            // Process each player
            for (Long playerId : playerIds) {
                try {
                    log.info("Enriching player ID: {}", playerId);
                    boolean success = activities.enrichPlayerData(playerId);
                    
                    if (success) {
                        enriched++;
                    } else {
                        failed++;
                    }
                    
                    // Small delay to avoid rate limits
                    if (enriched + failed < playerIds.size()) {
                        Workflow.sleep(Duration.ofSeconds(3));
                    }
                    
                } catch (Exception e) {
                    log.error("Failed to enrich player {}: {}", playerId, e.getMessage());
                    failed++;
                }
            }
            
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            log.info("Enrichment complete: {} enriched, {} failed in {}s", enriched, failed, duration);
            
            return EnrichmentResult.builder()
                .success(true)
                .playersProcessed(playerIds.size())
                .playersEnriched(enriched)
                .playersFailed(failed)
                .message(String.format("Enriched %d/%d players successfully", enriched, playerIds.size()))
                .durationSeconds(duration)
                .build();
                
        } catch (Exception e) {
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            log.error("Enrichment workflow failed: {}", e.getMessage());
            
            return EnrichmentResult.builder()
                .success(false)
                .playersProcessed(0)
                .playersEnriched(0)
                .playersFailed(0)
                .message("Workflow failed: " + e.getMessage())
                .durationSeconds(duration)
                .build();
        }
    }
    
    @Override
    public EnrichmentResult enrichSportPlayers(String sport) {
        long startTime = Workflow.currentTimeMillis();
        log.info("Starting enrichment workflow for {} players", sport);
        
        try {
            // Get players for specific sport with missing data
            List<Long> playerIds = activities.findPlayersWithMissingData(sport);
            
            if (playerIds.isEmpty()) {
                log.info("No {} players found with missing data", sport);
                return EnrichmentResult.builder()
                    .success(true)
                    .playersProcessed(0)
                    .playersEnriched(0)
                    .playersFailed(0)
                    .message(String.format("No %s players with missing data found", sport))
                    .durationSeconds((Workflow.currentTimeMillis() - startTime) / 1000)
                    .build();
            }
            
            log.info("Found {} {} players with missing data", playerIds.size(), sport);
            
            int enriched = 0;
            int failed = 0;
            
            // Process each player
            for (Long playerId : playerIds) {
                try {
                    log.info("Enriching {} player ID: {}", sport, playerId);
                    boolean success = activities.enrichPlayerData(playerId);
                    
                    if (success) {
                        enriched++;
                    } else {
                        failed++;
                    }
                    
                    // Small delay to avoid rate limits
                    if (enriched + failed < playerIds.size()) {
                        Workflow.sleep(Duration.ofSeconds(3));
                    }
                    
                } catch (Exception e) {
                    log.error("Failed to enrich player {}: {}", playerId, e.getMessage());
                    failed++;
                }
            }
            
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            log.info("Enrichment complete for {}: {} enriched, {} failed in {}s", 
                sport, enriched, failed, duration);
            
            return EnrichmentResult.builder()
                .success(true)
                .playersProcessed(playerIds.size())
                .playersEnriched(enriched)
                .playersFailed(failed)
                .message(String.format("Enriched %d/%d %s players successfully", 
                    enriched, playerIds.size(), sport))
                .durationSeconds(duration)
                .build();
                
        } catch (Exception e) {
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            log.error("Enrichment workflow failed for {}: {}", sport, e.getMessage());
            
            return EnrichmentResult.builder()
                .success(false)
                .playersProcessed(0)
                .playersEnriched(0)
                .playersFailed(0)
                .message("Workflow failed: " + e.getMessage())
                .durationSeconds(duration)
                .build();
        }
    }
}
