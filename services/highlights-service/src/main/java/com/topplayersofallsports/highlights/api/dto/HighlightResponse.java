package com.topplayersofallsports.highlights.api.dto;

import com.topplayersofallsports.highlights.domain.model.Highlight;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for highlight videos.
 * Matches frontend expectations for video-highlights-hub and player-profile pages.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HighlightResponse {

    private Long id;
    private String title;
    private String description;
    private String thumbnail;
    private String videoUrl;
    private Integer duration; // in seconds
    private Long views;
    private Long likes;
    private Instant uploadedAt;
    private String sport;
    private String league;
    private String videoType; // HIGHLIGHT, INTERVIEW, TRAINING, etc.
    private Boolean isFeatured;
    private Boolean isLive;
    private SourceInfo source;
    private List<String> teams;
    private List<String> players;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SourceInfo {
        private String name;
        private String logo;
        private String platform; // YOUTUBE, TWITTER, etc.
    }

    /**
     * Convert domain model to response DTO.
     */
    public static HighlightResponse fromDomain(Highlight highlight) {
        return HighlightResponse.builder()
            .id(highlight.getId())
            .title(highlight.getTitle())
            .description(highlight.getDescription())
            .thumbnail(highlight.getThumbnailUrl())
            .videoUrl(highlight.getUrl())
            .duration(highlight.getDurationSec())
            .views(highlight.getViewCount())
            .likes(highlight.getLikeCount())
            .uploadedAt(highlight.getPublishedAt())
            .sport(highlight.getSport())
            .league(highlight.getLeagueId())
            .videoType(highlight.getVideoType() != null ? highlight.getVideoType().name() : "HIGHLIGHT")
            .isFeatured(highlight.getIsFeatured())
            .isLive(false) // TODO: Add live stream support
            .source(SourceInfo.builder()
                .name(highlight.getChannelName())
                .logo(highlight.getChannelThumbnail())
                .platform(highlight.getPlatform().name())
                .build())
            .build();
    }
}
