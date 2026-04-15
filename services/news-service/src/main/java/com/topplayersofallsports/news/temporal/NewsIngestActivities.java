package com.topplayersofallsports.news.temporal;

import com.topplayersofallsports.news.domain.model.Sport;
import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

/**
 * Temporal activities for news ingestion
 */
@ActivityInterface
public interface NewsIngestActivities {
    
    /**
     * Fetch and store news for a specific sport
     * @param sport The sport to fetch news for
     * @return Number of articles saved
     */
    @ActivityMethod
    int fetchNewsForSport(Sport sport);
}
