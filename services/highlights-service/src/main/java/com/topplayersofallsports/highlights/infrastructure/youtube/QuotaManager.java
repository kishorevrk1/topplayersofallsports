package com.topplayersofallsports.highlights.infrastructure.youtube;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * YouTube API quota manager.
 * 
 * Tracks daily quota usage and prevents exceeding limits.
 * YouTube Data API v3 default quota: 10,000 units/day
 * 
 * Quota costs:
 * - playlistItems.list: 1 unit
 * - videos.list: 1 unit
 * - search.list: 100 units (expensive!)
 * 
 * Production-ready with thread-safe counters and daily reset.
 */
@Component
@Slf4j
public class QuotaManager {

    @Value("${highlights.youtube.quota.daily-limit:10000}")
    private int dailyLimit;

    @Value("${highlights.youtube.quota.alert-threshold:8000}")
    private int alertThreshold;

    private final AtomicInteger quotaUsed = new AtomicInteger(0);
    private LocalDate currentDate = LocalDate.now(ZoneId.of("America/Los_Angeles")); // YouTube uses PT

    /**
     * Check if we have enough quota remaining for an operation.
     * 
     * @param cost Quota cost of the operation
     * @return true if quota is available
     */
    public synchronized boolean hasQuota(int cost) {
        resetIfNewDay();
        
        int current = quotaUsed.get();
        int newTotal = current + cost;
        
        if (newTotal > dailyLimit) {
            log.warn("Quota limit reached: {} / {} units used", current, dailyLimit);
            return false;
        }
        
        return true;
    }

    /**
     * Consume quota for an operation.
     * 
     * @param cost Quota cost of the operation
     * @return true if quota was consumed, false if limit reached
     */
    public synchronized boolean consumeQuota(int cost) {
        resetIfNewDay();
        
        if (!hasQuota(cost)) {
            return false;
        }
        
        int newTotal = quotaUsed.addAndGet(cost);
        
        log.debug("Quota consumed: {} units (total: {} / {})", cost, newTotal, dailyLimit);
        
        // Alert if approaching limit
        if (newTotal >= alertThreshold && newTotal - cost < alertThreshold) {
            log.warn("⚠️ YouTube API quota alert: {} / {} units used ({}%)", 
                newTotal, dailyLimit, (newTotal * 100 / dailyLimit));
        }
        
        return true;
    }

    /**
     * Get current quota usage.
     */
    public int getQuotaUsed() {
        resetIfNewDay();
        return quotaUsed.get();
    }

    /**
     * Get remaining quota.
     */
    public int getQuotaRemaining() {
        resetIfNewDay();
        return dailyLimit - quotaUsed.get();
    }

    /**
     * Get quota usage percentage.
     */
    public int getQuotaUsagePercent() {
        resetIfNewDay();
        return (quotaUsed.get() * 100) / dailyLimit;
    }

    /**
     * Reset quota counter if it's a new day (Pacific Time).
     */
    private void resetIfNewDay() {
        LocalDate today = LocalDate.now(ZoneId.of("America/Los_Angeles"));
        
        if (!today.equals(currentDate)) {
            int previousUsage = quotaUsed.getAndSet(0);
            log.info("📊 Daily quota reset. Previous day usage: {} / {} units ({}%)", 
                previousUsage, dailyLimit, (previousUsage * 100 / dailyLimit));
            currentDate = today;
        }
    }

    /**
     * Quota costs for common operations.
     */
    public static class QuotaCost {
        public static final int PLAYLIST_ITEMS_LIST = 1;
        public static final int VIDEOS_LIST = 1;
        public static final int SEARCH_LIST = 100;
    }
}
