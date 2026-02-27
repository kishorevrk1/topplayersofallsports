package com.topplayersofallsports.playerservice.temporal.activity;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

import java.util.List;

/**
 * Temporal Activities for Player Data Enrichment
 * Uses AI to populate missing fields like height, weight, birthdate, etc.
 */
@ActivityInterface
public interface PlayerEnrichmentActivities {
    
    /**
     * Find all players with missing data fields
     * @param sport Optional sport filter (null for all sports)
     * @return List of player IDs with missing data
     */
    @ActivityMethod
    List<Long> findPlayersWithMissingData(String sport);
    
    /**
     * Enrich a single player's data using AI
     * @param playerId Player ID to enrich
     * @return true if enrichment was successful
     */
    @ActivityMethod
    boolean enrichPlayerData(Long playerId);
}
