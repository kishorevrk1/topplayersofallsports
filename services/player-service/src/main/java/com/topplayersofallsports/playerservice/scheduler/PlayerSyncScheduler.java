package com.topplayersofallsports.playerservice.scheduler;

import com.topplayersofallsports.playerservice.service.PlayerService;
import com.topplayersofallsports.playerservice.temporal.workflow.MonthlyRatingRefreshWorkflow;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowExecutionAlreadyStarted;
import io.temporal.client.WorkflowOptions;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
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

    /**
     * Monthly ACR rating refresh — 1st of every month at 2 AM.
     *
     * Fires a Temporal workflow and returns immediately (fire-and-forget).
     * The workflow processes stale ratings in batches of 5 with 12s inter-batch
     * delays to respect OpenRouter free-tier rate limits.
     *
     * Idempotency: the workflow ID is scoped to the current year-month, so
     * re-triggering in the same month catches {@link WorkflowExecutionAlreadyStarted}.
     *
     * Execution timeout: 8 hours — allows processing large player rosters.
     */
    @Scheduled(cron = "0 0 2 1 * *")
    public void monthlyRatingRefresh() {
        if (!temporalEnabled || workflowClient == null) {
            log.info("Temporal is disabled — skipping monthly rating refresh");
            return;
        }

        String yearMonth   = LocalDateTime.now().toLocalDate().toString().substring(0, 7); // e.g. 2026-03
        String workflowId  = "monthly-rating-refresh-" + yearMonth;
        log.info("=== Triggering Monthly ACR Rating Refresh (workflowId: {}) ===", workflowId);

        try {
            MonthlyRatingRefreshWorkflow stub = workflowClient.newWorkflowStub(
                    MonthlyRatingRefreshWorkflow.class,
                    WorkflowOptions.newBuilder()
                            .setTaskQueue(taskQueue)
                            .setWorkflowId(workflowId)
                            .setWorkflowExecutionTimeout(Duration.ofHours(8))
                            .build()
            );

            WorkflowClient.start(stub::refreshStaleRatings);
            log.info("Monthly ACR refresh accepted by Temporal — running in background");

        } catch (WorkflowExecutionAlreadyStarted e) {
            log.info("Monthly rating refresh already running for {} — skipping duplicate start", workflowId);
        } catch (Exception e) {
            log.error("Failed to trigger monthly rating refresh: {}", e.getMessage(), e);
        }
    }

    /** Manual trigger — used by admin/test tooling. */
    public void triggerManualSync() {
        log.info("Manual sync triggered");
        weeklyPlayerSync();
    }
}
