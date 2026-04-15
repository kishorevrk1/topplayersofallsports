package com.topplayersofallsports.news.api;

import com.topplayersofallsports.news.domain.model.NewsArticle;
import com.topplayersofallsports.news.domain.model.Sport;
import com.topplayersofallsports.news.service.NewsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for sports news
 */
@Slf4j
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Tag(name = "News", description = "Sports News API")
public class NewsController {
    
    private final NewsService newsService;
    
    /**
     * Get all news articles
     */
    @GetMapping
    @Operation(summary = "Get all news articles", 
               description = "Retrieve paginated list of all active news articles")
    public ResponseEntity<Page<NewsArticle>> getAllNews(
        @Parameter(description = "Page number (0-indexed)")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("GET /api/news - page: {}, size: {}", page, size);
        Page<NewsArticle> news = newsService.getAllNews(page, size);
        return ResponseEntity.ok(news);
    }
    
    /**
     * Get news by sport
     */
    @GetMapping("/sport/{sport}")
    @Operation(summary = "Get news by sport", 
               description = "Retrieve news articles for a specific sport")
    public ResponseEntity<Page<NewsArticle>> getNewsBySport(
        @Parameter(description = "Sport category")
        @PathVariable Sport sport,
        
        @Parameter(description = "Page number")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("GET /api/news/sport/{} - page: {}, size: {}", sport, page, size);
        Page<NewsArticle> news = newsService.getNewsBySport(sport, page, size);
        return ResponseEntity.ok(news);
    }
    
    /**
     * Get breaking news
     */
    @GetMapping("/breaking")
    @Operation(summary = "Get breaking news", 
               description = "Retrieve recent breaking news articles")
    public ResponseEntity<Page<NewsArticle>> getBreakingNews(
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) Sport sport,
        
        @Parameter(description = "Page number")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "10") int size
    ) {
        log.debug("GET /api/news/breaking - sport: {}, page: {}, size: {}", sport, page, size);
        
        Page<NewsArticle> news = (sport != null) 
            ? newsService.getBreakingNewsBySport(sport, page, size)
            : newsService.getBreakingNews(page, size);
            
        return ResponseEntity.ok(news);
    }
    
    /**
     * Get trending news
     */
    @GetMapping("/trending")
    @Operation(summary = "Get trending news", 
               description = "Retrieve most viewed articles in last 24 hours")
    public ResponseEntity<Page<NewsArticle>> getTrendingNews(
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) Sport sport,
        
        @Parameter(description = "Page number")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "10") int size
    ) {
        log.debug("GET /api/news/trending - sport: {}, page: {}, size: {}", sport, page, size);
        
        Page<NewsArticle> news = (sport != null)
            ? newsService.getTrendingNewsBySport(sport, page, size)
            : newsService.getTrendingNews(page, size);
            
        return ResponseEntity.ok(news);
    }
    
    /**
     * Search news
     */
    @GetMapping("/search")
    @Operation(summary = "Search news", 
               description = "Search news articles by keyword")
    public ResponseEntity<Page<NewsArticle>> searchNews(
        @Parameter(description = "Search keyword", required = true)
        @RequestParam String q,
        
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) Sport sport,
        
        @Parameter(description = "Page number")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("GET /api/news/search - q: {}, sport: {}, page: {}, size: {}", 
            q, sport, page, size);
        Page<NewsArticle> news = newsService.searchNews(q, sport, page, size);
        return ResponseEntity.ok(news);
    }
    
    /**
     * Get news by tag
     */
    @GetMapping("/tag/{tag}")
    @Operation(summary = "Get news by tag", 
               description = "Retrieve news articles with a specific tag")
    public ResponseEntity<Page<NewsArticle>> getNewsByTag(
        @Parameter(description = "Tag name")
        @PathVariable String tag,
        
        @Parameter(description = "Page number")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("GET /api/news/tag/{} - page: {}, size: {}", tag, page, size);
        Page<NewsArticle> news = newsService.getNewsByTag(tag, page, size);
        return ResponseEntity.ok(news);
    }
    
    /**
     * Get article by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get article by ID", 
               description = "Retrieve a specific news article and increment view count")
    public ResponseEntity<NewsArticle> getArticleById(
        @Parameter(description = "Article ID")
        @PathVariable Long id
    ) {
        log.debug("GET /api/news/{}", id);
        return newsService.getArticleById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get recent articles (last 24 hours)
     */
    @GetMapping("/recent")
    @Operation(summary = "Get recent articles", 
               description = "Retrieve articles published in the last 24 hours")
    public ResponseEntity<List<NewsArticle>> getRecentArticles(
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) Sport sport
    ) {
        log.debug("GET /api/news/recent - sport: {}", sport);
        List<NewsArticle> articles = newsService.getRecentArticles(sport);
        return ResponseEntity.ok(articles);
    }
    
    /**
     * Get news statistics
     */
    @GetMapping("/stats")
    @Operation(summary = "Get news statistics", 
               description = "Retrieve statistics about stored news articles")
    public ResponseEntity<NewsService.NewsStats> getStats() {
        log.debug("GET /api/news/stats");
        NewsService.NewsStats stats = newsService.getStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Manual trigger to fetch news (admin endpoint)
     */
    @PostMapping("/admin/fetch")
    @Operation(summary = "Manually fetch news", 
               description = "Trigger manual news fetch for a specific sport or all sports")
    public ResponseEntity<Map<String, Object>> manualFetch(
        @Parameter(description = "Sport to fetch (optional, fetches all if not specified)")
        @RequestParam(required = false) Sport sport
    ) {
        log.info("POST /api/news/admin/fetch - sport: {}", sport);
        
        try {
            int savedCount;
            if (sport != null) {
                savedCount = newsService.fetchAndStoreNews(sport);
            } else {
                List<Sport> allSports = List.of(
                    Sport.BASKETBALL, Sport.FOOTBALL, Sport.SOCCER, 
                    Sport.HOCKEY, Sport.TENNIS, Sport.MMA, 
                    Sport.BASEBALL, Sport.GOLF
                );
                savedCount = newsService.fetchAndStoreAllNews(allSports);
            }
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "News fetch completed",
                "articlesSaved", savedCount
            ));
        } catch (Exception e) {
            log.error("Error during manual fetch: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Failed to fetch news: " + e.getMessage()
            ));
        }
    }
}
