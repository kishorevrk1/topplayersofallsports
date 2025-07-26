package com.topplayersofallsports.backend.repository;

import com.topplayersofallsports.backend.model.NewsArticle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for NewsArticle entity operations
 */
@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {
    
    /**
     * Find published articles
     */
    Page<NewsArticle> findByStatusOrderByPublishedAtDesc(NewsArticle.ArticleStatus status, Pageable pageable);
    
    /**
     * Find articles by category
     */
    Page<NewsArticle> findByCategoryAndStatusOrderByPublishedAtDesc(
        NewsArticle.SportCategory category, 
        NewsArticle.ArticleStatus status, 
        Pageable pageable
    );
    
    /**
     * Find breaking news
     */
    @Query("SELECT a FROM NewsArticle a WHERE a.isBreaking = true AND a.status = 'PUBLISHED' ORDER BY a.publishedAt DESC")
    List<NewsArticle> findBreakingNews();
    
    /**
     * Find trending articles
     */
    @Query("SELECT a FROM NewsArticle a WHERE a.isTrending = true AND a.status = 'PUBLISHED' ORDER BY a.viewCount DESC")
    List<NewsArticle> findTrendingArticles();
    
    /**
     * Find featured articles
     */
    @Query("SELECT a FROM NewsArticle a WHERE a.isFeatured = true AND a.status = 'PUBLISHED' ORDER BY a.publishedAt DESC")
    List<NewsArticle> findFeaturedArticles();
    
    /**
     * Search articles by title or content
     */
    @Query("SELECT a FROM NewsArticle a WHERE a.status = 'PUBLISHED' AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.summary) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.content) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.publishedAt DESC")
    Page<NewsArticle> searchArticles(@Param("search") String search, Pageable pageable);
    
    /**
     * Find articles by author
     */
    Page<NewsArticle> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);
    
    /**
     * Find articles by date range
     */
    @Query("SELECT a FROM NewsArticle a WHERE a.status = 'PUBLISHED' AND " +
           "a.publishedAt BETWEEN :startDate AND :endDate ORDER BY a.publishedAt DESC")
    Page<NewsArticle> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );
    
    /**
     * Find most viewed articles
     */
    @Query("SELECT a FROM NewsArticle a WHERE a.status = 'PUBLISHED' ORDER BY a.viewCount DESC")
    Page<NewsArticle> findMostViewed(Pageable pageable);
    
    /**
     * Find AI generated articles
     */
    Page<NewsArticle> findByAiGeneratedTrueAndStatusOrderByCreatedAtDesc(
        NewsArticle.ArticleStatus status, 
        Pageable pageable
    );
    
    /**
     * Count articles by category
     */
    long countByCategoryAndStatus(NewsArticle.SportCategory category, NewsArticle.ArticleStatus status);
    
    /**
     * Count breaking news
     */
    long countByIsBreakingTrueAndStatus(NewsArticle.ArticleStatus status);
}
