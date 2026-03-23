package com.topplayersofallsports.news.repository;

import com.topplayersofallsports.news.domain.model.NewsArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface TrendingRepository extends JpaRepository<NewsArticle, Long> {

    @Query(value = """
        SELECT
            nat.tag as tag,
            COUNT(DISTINCT na.id) as mentionCount,
            COALESCE(SUM(na.view_count), 0) as totalViews,
            (COUNT(DISTINCT na.id) * 0.4 + COALESCE(SUM(na.view_count), 0) * 0.6) as trendingScore,
            na.sport as sport
        FROM news_article_tags nat
        JOIN news_articles na ON nat.article_id = na.id
        WHERE na.published_at > CAST(:since AS TIMESTAMP WITH TIME ZONE)
          AND na.is_active = true
          AND (:sport IS NULL OR na.sport = CAST(:sport AS VARCHAR))
        GROUP BY nat.tag, na.sport
        ORDER BY trendingScore DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTrendingTopics(
        @Param("since") Instant since,
        @Param("sport") String sport,
        @Param("limit") int limit
    );

    @Query(value = """
        SELECT
            nat.tag as playerName,
            na.sport as sport,
            COUNT(DISTINCT na.id) as articleCount,
            COALESCE(SUM(na.view_count), 0) as totalViews,
            (COUNT(DISTINCT na.id) * 0.3 + COALESCE(SUM(na.view_count), 0) * 0.7) as trendingScore,
            MAX(na.published_at) as lastMentioned,
            MAX(na.title) as recentHeadline
        FROM news_article_tags nat
        JOIN news_articles na ON nat.article_id = na.id
        WHERE na.published_at > CAST(:since AS TIMESTAMP WITH TIME ZONE)
          AND na.is_active = true
          AND (:sport IS NULL OR na.sport = CAST(:sport AS VARCHAR))
          AND nat.tag LIKE '%% %%'
          AND nat.tag NOT IN ('Premier League', 'Champions League', 'World Series',
                              'Super Bowl', 'NBA Finals', 'Stanley Cup',
                              'Yahoo Entertainment', 'Sporting News', 'The Times of India',
                              'The Hockey News', 'New York Post', 'BBC News', 'CBS Sports',
                              'MMA Mania', 'USA Today', 'Forbes', 'The Guardian')
        GROUP BY nat.tag, na.sport
        HAVING COUNT(DISTINCT na.id) >= 2
        ORDER BY trendingScore DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findTrendingPlayers(
        @Param("since") Instant since,
        @Param("sport") String sport,
        @Param("limit") int limit
    );
}
