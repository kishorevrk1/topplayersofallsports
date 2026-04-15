package com.topplayersofallsports.news.temporal;

import com.topplayersofallsports.news.domain.model.Sport;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.List;

/**
 * Implementation of news ingestion workflow
 * Runs periodically to fetch and store news articles
 */
@Slf4j
public class NewsIngestWorkflowImpl implements NewsIngestWorkflow {
    
    private final NewsIngestActivities activities;
    
    public NewsIngestWorkflowImpl() {
        this.activities = Workflow.newActivityStub(
            NewsIngestActivities.class,
            ActivityOptions.newBuilder()
                .setStartToCloseTimeout(Duration.ofMinutes(10))
                .setRetryOptions(
                    io.temporal.common.RetryOptions.newBuilder()
                        .setMaximumAttempts(3)
                        .setInitialInterval(Duration.ofSeconds(10))
                        .setMaximumInterval(Duration.ofMinutes(1))
                        .build()
                )
                .build()
        );
    }
    
    @Override
    public void ingestNews() {
        Workflow.getLogger(NewsIngestWorkflowImpl.class)
            .info("Starting news ingestion workflow");
        
        // List of sports to fetch news for (5 core sports)
        List<Sport> sports = List.of(
            Sport.FOOTBALL,
            Sport.BASKETBALL,
            Sport.CRICKET,
            Sport.TENNIS,
            Sport.MMA
        );
        
        // Fetch news for each sport
        for (Sport sport : sports) {
            try {
                int savedCount = activities.fetchNewsForSport(sport);
                Workflow.getLogger(NewsIngestWorkflowImpl.class)
                    .info("Fetched {} articles for {}", savedCount, sport);
                
                // Small delay between sports to avoid rate limiting
                Workflow.sleep(Duration.ofSeconds(2));
            } catch (Exception e) {
                Workflow.getLogger(NewsIngestWorkflowImpl.class)
                    .error("Error fetching news for {}: {}", sport, e.getMessage());
            }
        }
        
        Workflow.getLogger(NewsIngestWorkflowImpl.class)
            .info("News ingestion workflow completed");
    }
}
