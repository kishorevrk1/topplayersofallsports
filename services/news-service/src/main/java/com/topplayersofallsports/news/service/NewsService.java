package com.topplayersofallsports.news.service;

import com.topplayersofallsports.news.domain.model.NewsArticle;
import com.topplayersofallsports.news.domain.model.Sport;
import com.topplayersofallsports.news.infrastructure.newsapi.NewsAPIClient;
import com.topplayersofallsports.news.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing news articles
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NewsService {
    
    private final NewsArticleRepository newsRepository;
    private final NewsAPIClient newsAPIClient;
    
    /**
     * Fetch and store news articles for a specific sport
     */
    @Transactional
    public int fetchAndStoreNews(Sport sport) {
        log.info("Fetching news for sport: {}", sport);
        
        List<NewsArticle> articles = newsAPIClient.fetchTopArticles(sport);
        int savedCount = 0;
        
        for (NewsArticle article : articles) {
            try {
                // Check if article already exists
                if (!newsRepository.existsByUrl(article.getUrl())) {
                    newsRepository.save(article);
                    savedCount++;
                    log.debug("Saved new article: {}", article.getTitle());
                } else {
                    log.debug("Article already exists: {}", article.getTitle());
                }
            } catch (Exception e) {
                log.error("Error saving article: {}", e.getMessage());
            }
        }
        
        log.info("Saved {} new articles for {}", savedCount, sport);
        return savedCount;
    }
    
    /**
     * Fetch and store news for all configured sports
     */
    @Transactional
    public int fetchAndStoreAllNews(List<Sport> sports) {
        log.info("Fetching news for {} sports", sports.size());
        int totalSaved = 0;
        
        for (Sport sport : sports) {
            try {
                int saved = fetchAndStoreNews(sport);
                totalSaved += saved;
                
                // Small delay to avoid rate limiting
                Thread.sleep(1000);
            } catch (Exception e) {
                log.error("Error fetching news for {}: {}", sport, e.getMessage());
            }
        }
        
        log.info("Total articles saved: {}", totalSaved);
        return totalSaved;
    }
    
    /**
     * Get all news articles with pagination
     * Caching disabled due to lazy loading issues with tags collection
     */
    // @Cacheable(value = "news", key = "'all-' + #page + '-' + #size")
    @Transactional(readOnly = true)
    public Page<NewsArticle> getAllNews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.findByIsActiveTrueOrderByPublishedAtDesc(pageable);
    }
    
    /**
     * Get news articles by sport
     * Caching disabled due to lazy loading issues
     */
    // @Cacheable(value = "news", key = "#sport + '-' + #page + '-' + #size")
    @Transactional(readOnly = true)
    public Page<NewsArticle> getNewsBySport(Sport sport, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.findBySportAndIsActiveTrueOrderByPublishedAtDesc(sport, pageable);
    }
    
    /**
     * Get breaking news
     * Caching disabled due to lazy loading issues
     */
    // @Cacheable(value = "breaking-news", key = "'all-' + #page + '-' + #size")
    @Transactional(readOnly = true)
    public Page<NewsArticle> getBreakingNews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.findByIsBreakingTrueAndIsActiveTrueOrderByPublishedAtDesc(pageable);
    }
    
    /**
     * Get breaking news by sport
     * Caching disabled due to lazy loading issues
     */
    // @Cacheable(value = "breaking-news", key = "#sport + '-' + #page + '-' + #size")
    @Transactional(readOnly = true)
    public Page<NewsArticle> getBreakingNewsBySport(Sport sport, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.findBySportAndIsBreakingTrueAndIsActiveTrueOrderByPublishedAtDesc(sport, pageable);
    }
    
    /**
     * Search news articles
     */
    @Transactional(readOnly = true)
    public Page<NewsArticle> searchNews(String keyword, Sport sport, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        if (sport != null) {
            return newsRepository.searchByKeywordAndSport(keyword, sport, pageable);
        } else {
            return newsRepository.searchByKeyword(keyword, pageable);
        }
    }
    
    /**
     * Get trending news (most viewed in last 24 hours)
     * Caching disabled due to lazy loading issues
     */
    // @Cacheable(value = "trending-news", key = "'all-' + #page + '-' + #size")
    @Transactional(readOnly = true)
    public Page<NewsArticle> getTrendingNews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Instant since = Instant.now().minusSeconds(24 * 3600);
        Page<NewsArticle> result = newsRepository.findTrending(since, pageable);
        // Fallback: if no recent articles, show all-time most viewed
        if (result.isEmpty()) {
            result = newsRepository.findTrending(Instant.EPOCH, pageable);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Page<NewsArticle> getTrendingNewsBySport(Sport sport, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Instant since = Instant.now().minusSeconds(24 * 3600);
        Page<NewsArticle> result = newsRepository.findTrendingBySport(sport, since, pageable);
        if (result.isEmpty()) {
            result = newsRepository.findTrendingBySport(sport, Instant.EPOCH, pageable);
        }
        return result;
    }
    
    /**
     * Get news by tag
     */
    @Transactional(readOnly = true)
    public Page<NewsArticle> getNewsByTag(String tag, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.findByTag(tag, pageable);
    }
    
    /**
     * Get article by ID and increment view count
     */
    @Transactional
    public Optional<NewsArticle> getArticleById(Long id) {
        Optional<NewsArticle> article = newsRepository.findById(id);
        article.ifPresent(a -> {
            a.incrementViewCount();
            newsRepository.save(a);
        });
        return article;
    }
    
    /**
     * Get recent articles (last 24 hours)
     */
    @Transactional(readOnly = true)
    public List<NewsArticle> getRecentArticles(Sport sport) {
        Instant since = Instant.now().minusSeconds(24 * 3600);
        if (sport != null) {
            return newsRepository.findBySportAndPublishedAtAfterAndIsActiveTrue(sport, since);
        } else {
            return newsRepository.findByPublishedAtAfterAndIsActiveTrue(since);
        }
    }
    
    /**
     * Get statistics
     */
    @Transactional(readOnly = true)
    public NewsStats getStats() {
        long totalArticles = newsRepository.countByIsActiveTrue();
        
        return NewsStats.builder()
            .totalArticles(totalArticles)
            .basketballCount(newsRepository.countBySportAndIsActiveTrue(Sport.BASKETBALL))
            .footballCount(newsRepository.countBySportAndIsActiveTrue(Sport.FOOTBALL))
            .soccerCount(newsRepository.countBySportAndIsActiveTrue(Sport.SOCCER))
            .hockeyCount(newsRepository.countBySportAndIsActiveTrue(Sport.HOCKEY))
            .tennisCount(newsRepository.countBySportAndIsActiveTrue(Sport.TENNIS))
            .mmaCount(newsRepository.countBySportAndIsActiveTrue(Sport.MMA))
            .baseballCount(newsRepository.countBySportAndIsActiveTrue(Sport.BASEBALL))
            .golfCount(newsRepository.countBySportAndIsActiveTrue(Sport.GOLF))
            .build();
    }
    
    /**
     * News statistics DTO
     */
    @lombok.Data
    @lombok.Builder
    public static class NewsStats {
        private long totalArticles;
        private long basketballCount;
        private long footballCount;
        private long soccerCount;
        private long hockeyCount;
        private long tennisCount;
        private long mmaCount;
        private long baseballCount;
        private long golfCount;
    }
}
