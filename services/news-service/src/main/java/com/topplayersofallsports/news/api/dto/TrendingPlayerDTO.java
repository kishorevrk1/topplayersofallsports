package com.topplayersofallsports.news.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for trending players
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingPlayerDTO {
    private String playerName;
    private String sport;
    private Long articleCount;
    private Long totalViews;
    private Double trendingScore;
    private Instant lastMentioned;
    private String recentHeadline;
}
