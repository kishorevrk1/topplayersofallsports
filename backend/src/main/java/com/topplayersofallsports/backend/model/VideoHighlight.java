package com.topplayersofallsports.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * VideoHighlight entity representing sports video highlights
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "video_highlights")
public class VideoHighlight extends BaseEntity {
    
    @NotBlank
    @Size(max = 200)
    @Column(name = "title", nullable = false)
    private String title;
    
    @Size(max = 500)
    @Column(name = "description")
    private String description;
    
    @NotBlank
    @Column(name = "video_url", nullable = false)
    private String videoUrl;
    
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;
    
    @NotNull
    @Column(name = "duration", nullable = false)
    private Integer duration; // in seconds
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "sport", nullable = false)
    private SportType sport;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "highlight_type", nullable = false)
    private HighlightType highlightType = HighlightType.GAME_HIGHLIGHT;
    
    @Column(name = "tags")
    private String tags; // JSON array stored as string
    
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;
    
    @Column(name = "like_count", nullable = false)
    private Long likeCount = 0L;
    
    @Column(name = "dislike_count", nullable = false)
    private Long dislikeCount = 0L;
    
    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;
    
    @Column(name = "is_trending", nullable = false)
    private Boolean isTrending = false;
    
    @Column(name = "ai_generated", nullable = false)
    private Boolean aiGenerated = false;
    
    @Column(name = "external_source")
    private String externalSource; // YouTube, ESPN, etc.
    
    @Column(name = "external_id")
    private String externalId;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;
    
    @OneToMany(mappedBy = "video", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Comment> comments = new HashSet<>();
    
    public enum SportType {
        BASKETBALL, FOOTBALL, BASEBALL, HOCKEY, SOCCER, TENNIS, GOLF, ESPORTS
    }
    
    public enum HighlightType {
        GAME_HIGHLIGHT, BEST_PLAYS, GOALS, TOUCHDOWNS, DUNKS, HOME_RUNS, SAVES, INTERVIEWS
    }
    
    public void incrementViewCount() {
        this.viewCount++;
    }
    
    public void incrementLikeCount() {
        this.likeCount++;
    }
    
    public void incrementDislikeCount() {
        this.dislikeCount++;
    }
}
