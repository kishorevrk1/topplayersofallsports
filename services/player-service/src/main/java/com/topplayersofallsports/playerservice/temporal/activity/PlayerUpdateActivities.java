package com.topplayersofallsports.playerservice.temporal.activity;

import com.topplayersofallsports.playerservice.temporal.workflow.PlayerUpdateResult;
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

/**
 * Temporal Activities for Player Rating Updates
 */
@ActivityInterface
public interface PlayerUpdateActivities {
    
    /**
     * Fetch current player data from database
     */
    @ActivityMethod
    PlayerUpdateResult fetchCurrentPlayerData(Long playerId);
    
    /**
     * Fetch latest statistics from API-Sports
     */
    @ActivityMethod
    String fetchLatestPlayerStats(Long playerId);
    
    /**
     * Re-analyze player with AI based on latest stats
     */
    @ActivityMethod
    String reAnalyzePlayerWithAI(String playerName, String latestStats, Integer currentRating);
    
    /**
     * Update database with new rating and analysis
     */
    @ActivityMethod
    PlayerUpdateResult updatePlayerRating(Long playerId, String aiAnalysis, String latestStats);
}
