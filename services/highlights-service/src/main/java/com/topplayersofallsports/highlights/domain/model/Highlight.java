package com.topplayersofallsports.highlights.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * Domain entity representing a video highlight.
 * 
 * Follows DDD principles with rich domain model and encapsulation.
 * Optimized for PostgreSQL with proper indexing strategy.
 */
@Entity
@Table(name = "highlights", indexes = {
    @Index(name = "idx_highlights_published_at", columnList = "published_at DESC"),
    @Index(name = "idx_highlights_platform_video_id", columnList = "platform, video_id", unique = true),
    @Index(name = "idx_highlights_sport_league", columnList = "sport, league_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Highlight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Platform platform;

    @Column(name = "video_id", nullable = false, length = 100)
    private String videoId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 1000)
    private String url;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;

    @Column(name = "duration_sec")
    private Integer durationSec;

    @Column(length = 50)
    private String sport;

    @Column(name = "league_id", length = 100)
    private String leagueId;

    @Column(name = "view_count")
    private Long viewCount;

    @Column(name = "like_count")
    private Long likeCount;

    /**
     * Flexible JSON storage for platform-specific stats and metadata.
     * PostgreSQL JSONB provides efficient querying and indexing.
     */
    @Column(name = "stats_json", columnDefinition = "jsonb")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    private String statsJson;

    @OneToMany(mappedBy = "highlight", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<HighlightEntity> entities = new HashSet<>();

    @Column(name = "video_type", length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VideoType videoType = VideoType.HIGHLIGHT;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "channel_name", length = 200)
    private String channelName;

    @Column(name = "channel_thumbnail", length = 1000)
    private String channelThumbnail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Business methods

    /**
     * Add an entity tag (team, player, league) to this highlight.
     * Ensures bidirectional relationship consistency.
     */
    public void addEntity(HighlightEntity entity) {
        entities.add(entity);
        entity.setHighlight(this);
    }

    /**
     * Remove an entity tag from this highlight.
     */
    public void removeEntity(HighlightEntity entity) {
        entities.remove(entity);
        entity.setHighlight(null);
    }

    /**
     * Check if this highlight is considered "trending" based on recency and engagement.
     */
    public boolean isTrending() {
        if (publishedAt == null) return false;
        
        // Published within last 48 hours
        boolean isRecent = publishedAt.isAfter(Instant.now().minusSeconds(48 * 3600));
        
        // Has significant engagement (configurable threshold)
        boolean hasEngagement = (viewCount != null && viewCount > 10000) 
                             || (likeCount != null && likeCount > 500);
        
        return isRecent && hasEngagement;
    }

    /**
     * Calculate a simple engagement score for ranking.
     * Can be enhanced with more sophisticated algorithms.
     */
    public double calculateEngagementScore() {
        double views = viewCount != null ? viewCount : 0;
        double likes = likeCount != null ? likeCount : 0;
        
        // Weighted formula: views contribute less than likes
        return (views * 0.1) + (likes * 10);
    }

    public enum Platform {
        YOUTUBE,
        TWITTER,
        INSTAGRAM,
        TIKTOK
    }

    /**
     * Video type/category for organizing content.
     * Used for player profile video tabs and content filtering.
     */
    public enum VideoType {
        HIGHLIGHT,       // Game highlights, best plays, key moments
        INTERVIEW,       // Press conferences, Q&A sessions, media interviews
        TRAINING,        // Practice sessions, drills, workout footage
        BEHIND_SCENES,   // Locker room, off-court/field content, day-in-life
        FULL_GAME,       // Complete game replays, full match recordings
        DOCUMENTARY      // Player stories, career features, biographical content
    }
}
