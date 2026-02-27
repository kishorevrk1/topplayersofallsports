package com.topplayersofallsports.news.temporal;

import com.topplayersofallsports.news.domain.model.Sport;
import com.topplayersofallsports.news.service.NewsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Implementation of news ingestion activities
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NewsIngestActivitiesImpl implements NewsIngestActivities {
    
    private final NewsService newsService;
    
    @Override
    public int fetchNewsForSport(Sport sport) {
        log.info("Fetching news for sport: {}", sport);
        try {
            int savedCount = newsService.fetchAndStoreNews(sport);
            log.info("Successfully saved {} articles for {}", savedCount, sport);
            return savedCount;
        } catch (Exception e) {
            log.error("Error fetching news for {}: {}", sport, e.getMessage(), e);
            throw e;
        }
    }
}
