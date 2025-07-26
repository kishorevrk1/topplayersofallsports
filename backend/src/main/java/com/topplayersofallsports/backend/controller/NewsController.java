package com.topplayersofallsports.backend.controller;

import com.topplayersofallsports.backend.model.NewsArticle;
import com.topplayersofallsports.backend.repository.NewsArticleRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for news article endpoints
 */
@Slf4j
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Tag(name = "News", description = "Sports news and articles management")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class NewsController {
    
    private final NewsArticleRepository newsArticleRepository;
    
    /**
     * Get all published news articles with pagination
     */
    @GetMapping("/public")
    @Operation(summary = "Get published news articles", description = "Retrieve paginated list of published news articles")
    public ResponseEntity<Page<NewsArticle>> getPublishedNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) NewsArticle.SportCategory category) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NewsArticle> articles;
        
        if (category != null) {
            articles = newsArticleRepository.findByCategoryAndStatusOrderByPublishedAtDesc(
                category, NewsArticle.ArticleStatus.PUBLISHED, pageable
            );
        } else {
            articles = newsArticleRepository.findByStatusOrderByPublishedAtDesc(
                NewsArticle.ArticleStatus.PUBLISHED, pageable
            );
        }
        
        return ResponseEntity.ok(articles);
    }
    
    /**
     * Get breaking news
     */
    @GetMapping("/public/breaking")
    @Operation(summary = "Get breaking news", description = "Retrieve all breaking news articles")
    public ResponseEntity<List<NewsArticle>> getBreakingNews() {
        List<NewsArticle> breakingNews = newsArticleRepository.findBreakingNews();
        return ResponseEntity.ok(breakingNews);
    }
    
    /**
     * Get trending articles
     */
    @GetMapping("/public/trending")
    @Operation(summary = "Get trending articles", description = "Retrieve trending news articles")
    public ResponseEntity<List<NewsArticle>> getTrendingNews() {
        List<NewsArticle> trendingNews = newsArticleRepository.findTrendingArticles();
        return ResponseEntity.ok(trendingNews);
    }
    
    /**
     * Get featured articles
     */
    @GetMapping("/public/featured")
    @Operation(summary = "Get featured articles", description = "Retrieve featured news articles")
    public ResponseEntity<List<NewsArticle>> getFeaturedNews() {
        List<NewsArticle> featuredNews = newsArticleRepository.findFeaturedArticles();
        return ResponseEntity.ok(featuredNews);
    }
    
    /**
     * Search news articles
     */
    @GetMapping("/public/search")
    @Operation(summary = "Search news articles", description = "Search articles by title, summary, or content")
    public ResponseEntity<Page<NewsArticle>> searchNews(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NewsArticle> articles = newsArticleRepository.searchArticles(query, pageable);
        
        return ResponseEntity.ok(articles);
    }
    
    /**
     * Get article by ID
     */
    @GetMapping("/public/{id}")
    @Operation(summary = "Get article by ID", description = "Retrieve a specific news article by its ID")
    public ResponseEntity<NewsArticle> getArticleById(@PathVariable Long id) {
        return newsArticleRepository.findById(id)
            .map(article -> {
                // Increment view count
                article.incrementViewCount();
                newsArticleRepository.save(article);
                return ResponseEntity.ok(article);
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get most viewed articles
     */
    @GetMapping("/public/most-viewed")
    @Operation(summary = "Get most viewed articles", description = "Retrieve articles sorted by view count")
    public ResponseEntity<Page<NewsArticle>> getMostViewedNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<NewsArticle> articles = newsArticleRepository.findMostViewed(pageable);
        
        return ResponseEntity.ok(articles);
    }
}
