package com.topplayersofallsports.news.repository;

import com.topplayersofallsports.news.domain.model.NewsArticle;
import com.topplayersofallsports.news.domain.model.Sport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository for NewsArticle entities
 */
@Repository
public interface NewsArticleRepository extends JpaRepository<NewsArticle, Long> {
    
    /**
     * Find article by URL (to avoid duplicates)
     */
    Optional<NewsArticle> findByUrl(String url);
    
    /**
     * Check if article exists by URL
     */
    boolean existsByUrl(String url);
    
    /**
     * Find all active articles by sport
     */
    Page<NewsArticle> findBySportAndIsActiveTrueOrderByPublishedAtDesc(
        Sport sport, Pageable pageable);
    
    /**
     * Find all active articles
     */
    Page<NewsArticle> findByIsActiveTrueOrderByPublishedAtDesc(Pageable pageable);
    
    /**
     * Find breaking news
     */
    Page<NewsArticle> findByIsBreakingTrueAndIsActiveTrueOrderByPublishedAtDesc(
        Pageable pageable);
    
    /**
     * Find breaking news by sport
     */
    Page<NewsArticle> findBySportAndIsBreakingTrueAndIsActiveTrueOrderByPublishedAtDesc(
        Sport sport, Pageable pageable);
    
    /**
     * Search articles by keyword
     */
    @Query("SELECT n FROM NewsArticle n WHERE n.isActive = true AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(n.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY n.publishedAt DESC")
    Page<NewsArticle> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    /**
     * Search articles by keyword and sport
     */
    @Query("SELECT n FROM NewsArticle n WHERE n.isActive = true AND n.sport = :sport AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(n.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY n.publishedAt DESC")
    Page<NewsArticle> searchByKeywordAndSport(
        @Param("keyword") String keyword, 
        @Param("sport") Sport sport, 
        Pageable pageable);
    
    /**
     * Find articles published after a certain date
     */
    List<NewsArticle> findByPublishedAtAfterAndIsActiveTrue(Instant after);
    
    /**
     * Find articles by sport published after a certain date
     */
    List<NewsArticle> findBySportAndPublishedAtAfterAndIsActiveTrue(
        Sport sport, Instant after);
    
    /**
     * Find articles by tag
     */
    @Query("SELECT n FROM NewsArticle n JOIN n.tags t WHERE t = :tag AND n.isActive = true " +
           "ORDER BY n.publishedAt DESC")
    Page<NewsArticle> findByTag(@Param("tag") String tag, Pageable pageable);
    
    /**
     * Get trending articles (most viewed in last 24 hours)
     */
    @Query("SELECT n FROM NewsArticle n WHERE n.isActive = true AND " +
           "n.publishedAt >= :since ORDER BY n.viewCount DESC, n.publishedAt DESC")
    Page<NewsArticle> findTrending(@Param("since") Instant since, Pageable pageable);
    
    /**
     * Get trending articles by sport
     */
    @Query("SELECT n FROM NewsArticle n WHERE n.isActive = true AND n.sport = :sport AND " +
           "n.publishedAt >= :since ORDER BY n.viewCount DESC, n.publishedAt DESC")
    Page<NewsArticle> findTrendingBySport(
        @Param("sport") Sport sport, 
        @Param("since") Instant since, 
        Pageable pageable);
    
    /**
     * Count articles by sport
     */
    long countBySportAndIsActiveTrue(Sport sport);
    
    /**
     * Count all active articles
     */
    long countByIsActiveTrue();
}
