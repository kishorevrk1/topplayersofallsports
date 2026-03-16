package com.topplayersofallsports.playerservice.scheduler;

import com.topplayersofallsports.playerservice.service.PlayerService;
import io.temporal.client.WorkflowClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Value("${temporal.enabled:false}")
    private boolean temporalEnabled;

    @Value("${temporal.worker.task-queue:player-registration}")
    private String taskQueue;

    /** Injected only when temporal.enabled=true (TemporalConfig is @ConditionalOnProperty). */
    @Autowired(required = false)
    private WorkflowClient workflowClient;

    // ── Scheduled jobs ───────────────────────────────────────────────────────────

    /**
     * Weekly sync job — Every Sunday at 2 AM.
     * Pulls fresh player stats from external sports APIs.
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
            int footballSynced = playerService.syncFootballPlayers(currentSeason, 10);
            log.info("Football: {} players synced", footballSynced);
            log.info("=== Weekly Player Sync Completed ===");
            log.info(playerService.getSyncStats());
        } catch (Exception e) {
            log.error("Error during weekly player sync: {}", e.getMessage(), e);
        }
    }

    /** Manual trigger — used by admin/test tooling. */
    public void triggerManualSync() {
        log.info("Manual sync triggered");
        weeklyPlayerSync();
    }
}
