package com.topplayersofallsports.playerservice.temporal.activity;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.util.List;

@ActivityInterface
public interface BatchRegistrationActivities {
    
    /**
     * Generate a list of top players for a given sport using AI
     */
    @ActivityMethod
    List<String> generateTopPlayersList(String sport, int count, String source);
    
    /**
     * Filter out players that already exist in the database
     */
    @ActivityMethod
    List<String> filterExistingPlayers(List<String> playerNames, String sport);
    
    /**
     * Check if a batch registration can be started (rate limits, etc.)
     */
    @ActivityMethod
    boolean canStartBatchRegistration(String sport);
}
