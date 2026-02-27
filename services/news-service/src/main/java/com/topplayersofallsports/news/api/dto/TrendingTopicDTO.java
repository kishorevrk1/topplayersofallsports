package com.topplayersofallsports.news.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for trending topics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingTopicDTO {
    private String tag;
    private Long mentionCount;
    private Long totalViews;
    private Double trendingScore;
    private String sport;
}
