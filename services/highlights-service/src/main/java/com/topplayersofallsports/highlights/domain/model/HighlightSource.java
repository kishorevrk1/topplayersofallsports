package com.topplayersofallsports.highlights.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Configuration for highlight sources (YouTube channels/playlists).
 * Drives the Temporal ingest workflows.
 */
@Entity
@Table(name = "highlight_sources", indexes = {
    @Index(name = "idx_sources_active_weight", columnList = "active, weight DESC"),
    @Index(name = "idx_sources_sport_league", columnList = "sport, league_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HighlightSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private SourceType type;

    @Column(name = "channel_id", length = 100)
    private String channelId;

    @Column(name = "playlist_id", length = 100)
    private String playlistId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 50)
    private String sport;

    @Column(name = "league_id", length = 100)
    private String leagueId;

    @Column(name = "team_id", length = 100)
    private String teamId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * Weight for prioritizing sources in ingest scheduling.
     * Higher weight = more frequent polling.
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer weight = 1;

    /**
     * Last successful ingest timestamp for incremental fetching.
     */
    @Column(name = "last_ingested_at")
    private Instant lastIngestedAt;

    /**
     * Tracks last video published timestamp to optimize API calls.
     */
    @Column(name = "last_video_published_at")
    private Instant lastVideoPublishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Business methods

    /**
     * Calculate polling interval based on weight.
     * Higher weight sources are polled more frequently.
     */
    public long getPollingIntervalMinutes() {
        return switch (weight) {
            case 5 -> 5;   // Top priority: every 5 min
            case 4 -> 10;  // High priority: every 10 min
            case 3 -> 30;  // Medium: every 30 min
            case 2 -> 60;  // Low: hourly
            default -> 120; // Very low: every 2 hours
        };
    }

    /**
     * Mark this source as successfully ingested.
     */
    public void markIngested(Instant videoPublishedAt) {
        this.lastIngestedAt = Instant.now();
        if (videoPublishedAt != null && 
            (this.lastVideoPublishedAt == null || videoPublishedAt.isAfter(this.lastVideoPublishedAt))) {
            this.lastVideoPublishedAt = videoPublishedAt;
        }
    }

    public enum SourceType {
        YOUTUBE_CHANNEL,
        YOUTUBE_PLAYLIST
    }
}
