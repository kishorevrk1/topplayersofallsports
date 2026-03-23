package com.topplayersofallsports.news.service;

import com.topplayersofallsports.news.api.dto.TrendingPlayerDTO;
import com.topplayersofallsports.news.api.dto.TrendingTopicDTO;
import com.topplayersofallsports.news.domain.model.Sport;
import com.topplayersofallsports.news.repository.TrendingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrendingService {

    private final TrendingRepository trendingRepository;

    @Transactional(readOnly = true)
    public List<TrendingTopicDTO> getTrendingTopics(Sport sport, int hours, int limit) {
        String sportStr = sport != null ? sport.name() : null;
        Instant since = Instant.now().minusSeconds(hours * 3600L);

        List<Object[]> results = trendingRepository.findTrendingTopics(since, sportStr, limit);
        if (results.isEmpty()) {
            results = trendingRepository.findTrendingTopics(Instant.EPOCH, sportStr, limit);
        }

        List<TrendingTopicDTO> trending = new ArrayList<>();
        for (Object[] row : results) {
            try {
                trending.add(TrendingTopicDTO.builder()
                    .tag(str(row[0]))
                    .mentionCount(toLong(row[1]))
                    .totalViews(toLong(row[2]))
                    .trendingScore(toDouble(row[3]))
                    .sport(str(row[4]))
                    .build());
            } catch (Exception e) {
                log.warn("Failed to parse trending topic row: {}", e.getMessage());
            }
        }
        return trending;
    }

    @Transactional(readOnly = true)
    public List<TrendingPlayerDTO> getTrendingPlayers(Sport sport, int hours, int limit) {
        String sportStr = sport != null ? sport.name() : null;
        Instant since = Instant.now().minusSeconds(hours * 3600L);

        List<Object[]> results = trendingRepository.findTrendingPlayers(since, sportStr, limit);
        if (results.isEmpty()) {
            results = trendingRepository.findTrendingPlayers(Instant.EPOCH, sportStr, limit);
        }

        List<TrendingPlayerDTO> trending = new ArrayList<>();
        for (Object[] row : results) {
            try {
                trending.add(TrendingPlayerDTO.builder()
                    .playerName(str(row[0]))
                    .sport(str(row[1]))
                    .articleCount(toLong(row[2]))
                    .totalViews(toLong(row[3]))
                    .trendingScore(toDouble(row[4]))
                    .lastMentioned(toInstant(row[5]))
                    .recentHeadline(str(row[6]))
                    .build());
            } catch (Exception e) {
                log.warn("Failed to parse trending player row: {}", e.getMessage());
            }
        }
        return trending;
    }

    private static String str(Object o) {
        return o != null ? o.toString() : null;
    }

    private static long toLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Number n) return n.longValue();
        return Long.parseLong(o.toString());
    }

    private static double toDouble(Object o) {
        if (o == null) return 0.0;
        if (o instanceof Number n) return n.doubleValue();
        return Double.parseDouble(o.toString());
    }

    private static Instant toInstant(Object o) {
        if (o == null) return Instant.now();
        if (o instanceof java.sql.Timestamp ts) return ts.toInstant();
        if (o instanceof java.time.OffsetDateTime odt) return odt.toInstant();
        if (o instanceof Instant i) return i;
        return Instant.now();
    }
}
