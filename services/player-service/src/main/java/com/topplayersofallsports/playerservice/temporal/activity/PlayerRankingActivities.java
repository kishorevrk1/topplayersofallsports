package com.topplayersofallsports.playerservice.temporal.activity;

import com.topplayersofallsports.playerservice.entity.Sport;
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.util.List;

/**
 * Temporal activities for player ranking operations
 */
@ActivityInterface
public interface PlayerRankingActivities {
    
    /**
     * Initialize top 50 players for a sport using AI
     */
    @ActivityMethod
    InitializeTop50Result initializeTop50ForSport(Sport sport);
    
    /**
     * Evaluate if a player qualifies for top 50
     */
    @ActivityMethod
    PlayerEvaluationResult evaluatePlayerForTop50(String playerName, Sport sport);
    
    /**
     * Update rankings for a sport (monthly)
     */
    @ActivityMethod
    RankingUpdateResult updateRankingsForSport(Sport sport);
    
    /**
     * Check if sport already has top 50 initialized
     */
    @ActivityMethod
    boolean isSportInitialized(Sport sport);
    
    /**
     * Get current top 50 count for a sport
     */
    @ActivityMethod
    int getTop50Count(Sport sport);
    
    // DTOs
    
    record InitializeTop50Result(
        Sport sport,
        int playersAdded,
        boolean success,
        String message,
        List<String> topPlayers
    ) {}
    
    record PlayerEvaluationResult(
        String playerName,
        boolean qualifies,
        double rankingScore,
        Integer estimatedRank,
        String reasoning
    ) {}
    
    record RankingUpdateResult(
        Sport sport,
        int playersUpdated,
        int playersAdded,
        int playersRemoved,
        boolean success,
        String message
    ) {}
}
