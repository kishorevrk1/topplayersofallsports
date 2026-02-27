package com.topplayersofallsports.playerservice.temporal.activity;

import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.service.PlayerRankingService;
import io.temporal.activity.Activity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of player ranking Temporal activities
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class PlayerRankingActivitiesImpl implements PlayerRankingActivities {
    
    private final PlayerRankingService rankingService;
    
    @Override
    public InitializeTop50Result initializeTop50ForSport(Sport sport) {
        log.info("[Temporal Activity] Initializing top 50 for {}", sport);
        Activity.getExecutionContext().heartbeat(null);
        
        try {
            // Check if already initialized
            if (isSportInitialized(sport)) {
                int count = getTop50Count(sport);
                log.info("{} already has {} ranked players", sport, count);
                return new InitializeTop50Result(
                    sport,
                    0,
                    true,
                    String.format("%s already initialized with %d players", sport, count),
                    List.of()
                );
            }
            
            // Initialize with AI
            List<Player> players = rankingService.initializeTop50(sport);
            Activity.getExecutionContext().heartbeat(null);
            
            List<String> topPlayerNames = players.stream()
                .limit(10)
                .map(p -> String.format("#%d - %s", p.getCurrentRank(), 
                    p.getDisplayName() != null ? p.getDisplayName() : p.getName()))
                .collect(Collectors.toList());
            
            log.info("[Temporal Activity] Successfully initialized {} with {} players", 
                sport, players.size());
            
            return new InitializeTop50Result(
                sport,
                players.size(),
                true,
                String.format("Successfully initialized %s with %d players", sport, players.size()),
                topPlayerNames
            );
            
        } catch (Exception e) {
            log.error("[Temporal Activity] Failed to initialize {} top 50: {}", 
                sport, e.getMessage(), e);
            return new InitializeTop50Result(
                sport,
                0,
                false,
                "Failed: " + e.getMessage(),
                List.of()
            );
        }
    }
    
    @Override
    public PlayerEvaluationResult evaluatePlayerForTop50(String playerName, Sport sport) {
        log.info("[Temporal Activity] Evaluating {} for {} top 50", playerName, sport);
        Activity.getExecutionContext().heartbeat(null);
        
        try {
            boolean qualifies = rankingService.evaluatePlayerForTop50(playerName, sport);
            
            return new PlayerEvaluationResult(
                playerName,
                qualifies,
                qualifies ? 85.0 : 65.0, // Simplified scoring
                qualifies ? 45 : null,
                qualifies ? "Player qualifies for top 50" : "Player does not meet top 50 criteria"
            );
            
        } catch (Exception e) {
            log.error("[Temporal Activity] Failed to evaluate {}: {}", playerName, e.getMessage());
            return new PlayerEvaluationResult(
                playerName,
                false,
                0.0,
                null,
                "Evaluation failed: " + e.getMessage()
            );
        }
    }
    
    @Override
    public RankingUpdateResult updateRankingsForSport(Sport sport) {
        log.info("[Temporal Activity] Updating rankings for {}", sport);
        Activity.getExecutionContext().heartbeat(null);
        
        try {
            rankingService.updateRankingsForSport(sport);
            
            return new RankingUpdateResult(
                sport,
                50, // All players potentially updated
                0,  // New players added
                0,  // Players removed
                true,
                String.format("Successfully updated rankings for %s", sport)
            );
            
        } catch (Exception e) {
            log.error("[Temporal Activity] Failed to update rankings for {}: {}", 
                sport, e.getMessage(), e);
            return new RankingUpdateResult(
                sport,
                0,
                0,
                0,
                false,
                "Failed: " + e.getMessage()
            );
        }
    }
    
    @Override
    public boolean isSportInitialized(Sport sport) {
        long count = rankingService.getTop50(sport).size();
        boolean initialized = count >= 50;
        log.info("[Temporal Activity] {} initialized: {} (has {} players)", 
            sport, initialized, count);
        return initialized;
    }
    
    @Override
    public int getTop50Count(Sport sport) {
        int count = rankingService.getTop50(sport).size();
        log.info("[Temporal Activity] {} has {} top 50 players", sport, count);
        return count;
    }
}
