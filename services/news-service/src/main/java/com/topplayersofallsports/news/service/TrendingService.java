package com.topplayersofallsports.news.service;

import com.topplayersofallsports.news.api.dto.TrendingPlayerDTO;
import com.topplayersofallsports.news.api.dto.TrendingTopicDTO;
import com.topplayersofallsports.news.domain.model.Sport;
import com.topplayersofallsports.news.repository.TrendingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for trending topics and players
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TrendingService {
    
    private final TrendingRepository trendingRepository;
    
    /**
     * Get trending topics in the last N hours
     */
    @Transactional(readOnly = true)
    public List<TrendingTopicDTO> getTrendingTopics(Sport sport, int hours, int limit) {
        Instant since = Instant.now().minusSeconds(hours * 3600L);
        String sportStr = sport != null ? sport.name() : null;
        
        log.debug("Finding trending topics for sport: {}, hours: {}, limit: {}", sport, hours, limit);
        
        List<Object[]> results = trendingRepository.findTrendingTopics(since, sportStr, limit);
        List<TrendingTopicDTO> trending = new ArrayList<>();
        
        for (Object[] row : results) {
            TrendingTopicDTO dto = TrendingTopicDTO.builder()
                .tag((String) row[0])
                .mentionCount(((BigInteger) row[1]).longValue())
                .totalViews(((BigDecimal) row[2]).longValue())
                .trendingScore(((BigDecimal) row[3]).doubleValue())
                .sport((String) row[4])
                .build();
            trending.add(dto);
        }
        
        log.info("Found {} trending topics", trending.size());
        return trending;
    }
    
    /**
     * Get trending players in the last N hours
     */
    @Transactional(readOnly = true)
    public List<TrendingPlayerDTO> getTrendingPlayers(Sport sport, int hours, int limit) {
        Instant since = Instant.now().minusSeconds(hours * 3600L);
        String sportStr = sport != null ? sport.name() : null;
        
        log.debug("Finding trending players for sport: {}, hours: {}, limit: {}", sport, hours, limit);
        
        List<Object[]> results = trendingRepository.findTrendingPlayers(since, sportStr, limit);
        List<TrendingPlayerDTO> trending = new ArrayList<>();
        
        for (Object[]row : results) {
            TrendingPlayerDTO dto = TrendingPlayerDTO.builder()
                .playerName((String) row[0])
                .sport((String) row[1])
                .articleCount(((BigInteger) row[2]).longValue())
                .totalViews(((BigDecimal) row[3]).longValue())
                .trendingScore(((BigDecimal) row[4]).doubleValue())
                .lastMentioned(((Timestamp) row[5]).toInstant())
                .recentHeadline((String) row[6])
                .build();
            trending.add(dto);
        }
        
        log.info("Found {} trending players", trending.size());
        return trending;
    }
}
