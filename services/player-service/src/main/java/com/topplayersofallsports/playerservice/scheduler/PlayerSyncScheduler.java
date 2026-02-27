package com.topplayersofallsports.playerservice.scheduler;

import com.topplayersofallsports.playerservice.service.PlayerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.Year;

@Component
@Slf4j
@RequiredArgsConstructor
public class PlayerSyncScheduler {
    
    private final PlayerService playerService;
    
    @Value("${player.sync.enabled}")
    private boolean syncEnabled;
    
    @Value("${player.sync.players-per-sport}")
    private int playersPerSport;
    
    /**
     * Weekly sync job - Every Sunday at 2 AM
     * Cron: "0 0 2 * * SUN"
     */
    @Scheduled(cron = "${player.sync.cron}")
    public void weeklyPlayerSync() {
        if (!syncEnabled) {
            log.info("Player sync is disabled");
            return;
        }
        
        log.info("=== Starting Weekly Player Sync at {} ===", LocalDateTime.now());
        
        int currentSeason = Year.now().getValue();
        
        try {
            // Sync Football players (10 per league = 50 total)
            log.info("Syncing Football players...");
            int footballSynced = playerService.syncFootballPlayers(currentSeason, 10);
            log.info("Football: {} players synced", footballSynced);
            
            // TODO: Add Basketball, MMA, Cricket, Tennis sync methods
            // playerService.syncBasketballPlayers(currentSeason, playersPerSport);
            // playerService.syncMMAPlayers(playersPerSport);
            // playerService.syncCricketPlayers(currentSeason, playersPerSport);
            // playerService.syncTennisPlayers(playersPerSport);
            
            log.info("=== Weekly Player Sync Completed ===");
            log.info(playerService.getSyncStats());
            
        } catch (Exception e) {
            log.error("Error during weekly player sync: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manual trigger endpoint (for testing)
     */
    public void triggerManualSync() {
        log.info("Manual sync triggered");
        weeklyPlayerSync();
    }
}
