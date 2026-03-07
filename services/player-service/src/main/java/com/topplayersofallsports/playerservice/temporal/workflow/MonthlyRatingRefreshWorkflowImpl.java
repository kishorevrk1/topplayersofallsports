package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.RatingActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Implementation of the monthly ACR rating refresh workflow.
 *
 * Processes stale players in batches of 5 with a 12-second inter-batch sleep
 * to respect OpenRouter free-tier rate limits (~5 req/min).
 *
 * Circuit breaker: stops early if more than 50% of players fail, signalling
 * a systemic AI API outage rather than individual player issues.
 */
public class MonthlyRatingRefreshWorkflowImpl implements MonthlyRatingRefreshWorkflow {

    private static final int    BATCH_SIZE                       = 5;
    private static final double CIRCUIT_BREAKER_FAILURE_RATE     = 0.50;
    private static final int    MIN_PLAYERS_BEFORE_CIRCUIT_BREAK = 5;

    private final RatingActivities ratingActivities = Workflow.newActivityStub(
            RatingActivities.class,
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(15))
                    .setHeartbeatTimeout(Duration.ofMinutes(2))
                    .setRetryOptions(RetryOptions.newBuilder()
                            .setMaximumAttempts(3)
                            .setInitialInterval(Duration.ofSeconds(30))
                            .setMaximumInterval(Duration.ofMinutes(2))
                            .build())
                    .build()
    );

    @Override
    public MonthlyRatingRefreshResult refreshStaleRatings() {
        Instant start  = Instant.now();
        String  runId  = Workflow.getInfo().getRunId();

        Workflow.getLogger(MonthlyRatingRefreshWorkflowImpl.class)
                .info("[MonthlyRatingRefresh] Starting — runId: {}", runId);

        List<Long> stalePlayerIds = ratingActivities.findStalePlayerIds();
        int found = stalePlayerIds.size();

        if (found == 0) {
            Workflow.getLogger(MonthlyRatingRefreshWorkflowImpl.class)
                    .info("[MonthlyRatingRefresh] All ratings are fresh — nothing to do");
            return new MonthlyRatingRefreshResult(0, 0, 0, 0, "No stale ratings — all up to date.");
        }

        Workflow.getLogger(MonthlyRatingRefreshWorkflowImpl.class)
                .info("[MonthlyRatingRefresh] {} stale ratings to refresh", found);

        int     refreshed     = 0;
        int     failed        = 0;
        boolean circuitBroken = false;

        // Process in batches of BATCH_SIZE with inter-batch sleep
        for (int batchStart = 0; batchStart < stalePlayerIds.size(); batchStart += BATCH_SIZE) {
            int batchEnd = Math.min(batchStart + BATCH_SIZE, stalePlayerIds.size());
            List<Long> batch = stalePlayerIds.subList(batchStart, batchEnd);

            for (Long playerId : batch) {
                int processed = refreshed + failed;

                if (processed >= MIN_PLAYERS_BEFORE_CIRCUIT_BREAK
                        && (double) failed / processed > CIRCUIT_BREAKER_FAILURE_RATE) {
                    Workflow.getLogger(MonthlyRatingRefreshWorkflowImpl.class)
                            .warn("[MonthlyRatingRefresh] Circuit breaker: {}/{} processed, {} failed — stopping",
                                    processed, found, failed);
                    circuitBroken = true;
                    break;
                }

                try {
                    boolean success = ratingActivities.refreshPlayerRating(playerId, runId);
                    if (success) {
                        ratingActivities.invalidatePlayerCache(playerId);
                        refreshed++;
                    } else {
                        failed++;
                    }
                } catch (Exception e) {
                    Workflow.getLogger(MonthlyRatingRefreshWorkflowImpl.class)
                            .error("[MonthlyRatingRefresh] Error for player {}: {}", playerId, e.getMessage());
                    failed++;
                }
            }

            if (circuitBroken) break;

            // 12-second delay between batches to respect OpenRouter free-tier rate limits
            if (batchEnd < stalePlayerIds.size()) {
                Workflow.sleep(Duration.ofSeconds(12));
            }
        }

        long   durationSeconds = Instant.now().getEpochSecond() - start.getEpochSecond();
        int    notProcessed    = found - refreshed - failed;
        String message = String.format(
                "Refreshed %d/%d players | failed=%d | skipped-by-circuit-breaker=%d | duration=%ds%s",
                refreshed, found, failed, notProcessed, durationSeconds,
                circuitBroken ? " [CIRCUIT BREAKER TRIGGERED]" : ""
        );

        Workflow.getLogger(MonthlyRatingRefreshWorkflowImpl.class)
                .info("[MonthlyRatingRefresh] Complete — {}", message);

        return new MonthlyRatingRefreshResult(found, refreshed, failed, durationSeconds, message);
    }
}
