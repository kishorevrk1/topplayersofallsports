package com.topplayersofallsports.news.repository;

import com.topplayersofallsports.news.domain.model.NewsArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for trending queries
 */
@Repository
public interface TrendingRepository extends JpaRepository<NewsArticle, Long> {
    
    /**
     * Get trending topics based on tag mentions and views in the last N hours
     */
    @Query(value = """
        SELECT 
            nat.tag as tag,
            COUNT(DISTINCT na.id) as mentionCount,
            COALESCE(SUM(na.view_count), 0) as totalViews,
            (COUNT(DISTINCT na.id) * 0.4 + COALESCE(SUM(na.view_count), 0) * 0.6) as trendingScore,
            na.sport as sport
        FROM news_article_tags nat
        JOIN news_articles na ON nat.article_id = na.id
        WHERE na.published_at > :since
          AND na.is_active = true
          AND (:sport IS NULL OR na.sport = :sport)
        GROUP BY nat.tag, na.sport
        ORDER BY trendingScore DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTrendingTopics(
        @Param("since") Instant since,
        @Param("sport") String sport,
        @Param("limit") int limit
    );
    
    /**
     * Get trending players (tags that look like player names)
     */
    @Query(value = """
        SELECT 
            nat.tag as playerName,
            na.sport as sport,
            COUNT(DISTINCT na.id) as articleCount,
            COALESCE(SUM(na.view_count), 0) as totalViews,
            (COUNT(DISTINCT na.id) * 0.3 + COALESCE(SUM(na.view_count), 0) * 0.7) as trendingScore,
            MAX(na.published_at) as lastMentioned,
            (SELECT title FROM news_articles WHERE id = MAX(na.id)) as recentHeadline
        FROM news_article_tags nat
        JOIN news_articles na ON nat.article_id = na.id
        WHERE na.published_at > :since
          AND na.is_active = true
          AND (:sport IS NULL OR na.sport = :sport)
          AND (nat.tag LIKE '% %' OR LENGTH(nat.tag) > 10)
          AND nat.tag NOT IN ('Premier League', 'Champions League', 'World Series', 
                              'Super Bowl', 'NBA Finals', 'Stanley Cup')
        GROUP BY nat.tag, na.sport
        ORDER BY trendingScore DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTrendingPlayers(
        @Param("since") Instant since,
        @Param("sport") String sport,
        @Param("limit") int limit
    );
}
