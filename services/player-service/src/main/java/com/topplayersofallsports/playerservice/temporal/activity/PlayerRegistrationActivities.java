package com.topplayersofallsports.playerservice.temporal.activity;

import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import com.topplayersofallsports.playerservice.dto.ai.PlayerSearchResult;
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

/**
 * Temporal Activities for Player Registration
 * Each activity is a discrete, retriable unit of work
 */
@ActivityInterface
public interface PlayerRegistrationActivities {
    
    /**
     * Activity 1: Search and validate player using AI
     * Retries on 429 rate limits with exponential backoff
     */
    @ActivityMethod
    PlayerSearchResult searchPlayerWithAI(String playerName, String sport, String hints);
    
    /**
     * Activity 2: Check if player already exists in database
     */
    @ActivityMethod
    PlayerRegistrationResponse checkExistingPlayer(String playerName);
    
    /**
     * Activity 3: Fetch player data from external API (API-Sports)
     * Retries on rate limits and network failures
     */
    @ActivityMethod
    String fetchPlayerFromAPI(String sport, String searchQuery, String team);
    
    /**
     * Activity 4: Generate AI analysis and rating
     * Retries on 429 rate limits with exponential backoff
     */
    @ActivityMethod
    String generateAIAnalysis(String playerName, String playerData, String sport);
    
    /**
     * Activity 5: Save complete player profile to database
     */
    @ActivityMethod
    PlayerRegistrationResponse savePlayerProfile(
        PlayerSearchResult searchResult,
        String playerData,
        String aiAnalysis
    );
}
