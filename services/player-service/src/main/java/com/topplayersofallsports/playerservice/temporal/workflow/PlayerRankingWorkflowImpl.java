package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRankingActivities;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRankingActivities.InitializeTop50Result;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRankingActivities.RankingUpdateResult;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Implementation of player ranking workflows
 */
@Slf4j
public class PlayerRankingWorkflowImpl implements PlayerRankingWorkflow, AllSportsRankingWorkflow {
    
    private final PlayerRankingActivities activities;
    
    public PlayerRankingWorkflowImpl() {
        // Configure activity options with longer timeouts for AI operations
        ActivityOptions options = ActivityOptions.newBuilder()
            .setStartToCloseTimeout(Duration.ofMinutes(10)) // 10 min for 50 players
            .setRetryOptions(io.temporal.common.RetryOptions.newBuilder()
                .setMaximumAttempts(3)
                .setInitialInterval(Duration.ofSeconds(10))
                .build())
            .build();
        
        this.activities = Workflow.newActivityStub(PlayerRankingActivities.class, options);
    }
    
    @Override
    public RankingWorkflowResult initializeTop50(Sport sport) {
        long startTime = Workflow.currentTimeMillis();
        
        Workflow.getLogger(PlayerRankingWorkflowImpl.class)
            .info("Starting top 50 initialization for {}", sport);
        
        try {
            // Check if already initialized
            boolean initialized = activities.isSportInitialized(sport);
            if (initialized) {
                int count = activities.getTop50Count(sport);
                Workflow.getLogger(PlayerRankingWorkflowImpl.class)
                    .info("{} already initialized with {} players", sport, count);
                
                return new RankingWorkflowResult(
                    sport,
                    true,
                    count,
                    String.format("%s already initialized with %d players", sport, count),
                    (Workflow.currentTimeMillis() - startTime) / 1000
                );
            }
            
            // Initialize top 50
            InitializeTop50Result result = activities.initializeTop50ForSport(sport);
            
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            
            if (result.success()) {
                Workflow.getLogger(PlayerRankingWorkflowImpl.class)
                    .info("Successfully initialized {} - added {} players in {}s",
                        sport, result.playersAdded(), duration);
            } else {
                Workflow.getLogger(PlayerRankingWorkflowImpl.class)
                    .error("Failed to initialize {}: {}", sport, result.message());
            }
            
            return new RankingWorkflowResult(
                sport,
                result.success(),
                result.playersAdded(),
                result.message(),
                duration
            );
            
        } catch (Exception e) {
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            Workflow.getLogger(PlayerRankingWorkflowImpl.class)
                .error("Error in initialization workflow for {}: {}", sport, e.getMessage());
            
            return new RankingWorkflowResult(
                sport,
                false,
                0,
                "Workflow failed: " + e.getMessage(),
                duration
            );
        }
    }
    
    @Override
    public AllSportsRankingResult initializeAllSports() {
        long startTime = Workflow.currentTimeMillis();
        
        Workflow.getLogger(PlayerRankingWorkflowImpl.class)
            .info("Starting top 50 initialization for ALL sports");
        
        Sport[] allSports = {Sport.FOOTBALL, Sport.BASKETBALL, Sport.CRICKET, Sport.TENNIS, Sport.MMA};
        Map<Sport, RankingWorkflowResult> results = new HashMap<>();
        int successful = 0;
        int failed = 0;
        
        for (Sport sport : allSports) {
            Workflow.getLogger(PlayerRankingWorkflowImpl.class)
                .info("Processing sport {}/5: {}", results.size() + 1, sport);
            
            RankingWorkflowResult result = initializeTop50(sport);
            results.put(sport, result);
            
            if (result.success()) {
                successful++;
            } else {
                failed++;
            }
            
            // Small delay between sports to avoid overwhelming AI API
            if (results.size() < allSports.length) {
                Workflow.sleep(Duration.ofSeconds(5));
            }
        }
        
        long totalDuration = (Workflow.currentTimeMillis() - startTime) / 1000;
        
        Workflow.getLogger(PlayerRankingWorkflowImpl.class)
            .info("Completed initialization for all sports: {} successful, {} failed in {}s",
                successful, failed, totalDuration);
        
        return new AllSportsRankingResult(
            allSports.length,
            successful,
            failed,
            results,
            totalDuration
        );
    }
    
    @Override
    public RankingWorkflowResult updateMonthlyRankings(Sport sport) {
        long startTime = Workflow.currentTimeMillis();
        
        Workflow.getLogger(PlayerRankingWorkflowImpl.class)
            .info("Starting monthly ranking update for {}", sport);
        
        try {
            RankingUpdateResult result = activities.updateRankingsForSport(sport);
            
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            
            return new RankingWorkflowResult(
                sport,
                result.success(),
                result.playersUpdated(),
                result.message(),
                duration
            );
            
        } catch (Exception e) {
            long duration = (Workflow.currentTimeMillis() - startTime) / 1000;
            return new RankingWorkflowResult(
                sport,
                false,
                0,
                "Update failed: " + e.getMessage(),
                duration
            );
        }
    }
    
    @Override
    public AllSportsRankingResult updateAllSportsMonthly() {
        long startTime = Workflow.currentTimeMillis();
        
        Workflow.getLogger(PlayerRankingWorkflowImpl.class)
            .info("Starting monthly ranking update for ALL sports");
        
        Sport[] allSports = {Sport.FOOTBALL, Sport.BASKETBALL, Sport.CRICKET, Sport.TENNIS, Sport.MMA};
        Map<Sport, RankingWorkflowResult> results = new HashMap<>();
        int successful = 0;
        int failed = 0;
        
        for (Sport sport : allSports) {
            RankingWorkflowResult result = updateMonthlyRankings(sport);
            results.put(sport, result);
            
            if (result.success()) {
                successful++;
            } else {
                failed++;
            }
            
            // Delay between sports
            if (results.size() < allSports.length) {
                Workflow.sleep(Duration.ofSeconds(5));
            }
        }
        
        long totalDuration = (Workflow.currentTimeMillis() - startTime) / 1000;
        
        Workflow.getLogger(PlayerRankingWorkflowImpl.class)
            .info("Completed monthly update for all sports: {} successful, {} failed in {}s",
                successful, failed, totalDuration);
        
        return new AllSportsRankingResult(
            allSports.length,
            successful,
            failed,
            results,
            totalDuration
        );
    }
}
