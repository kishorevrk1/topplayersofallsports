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
 * NewsArticle entity representing sports news articles
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "news_articles")
public class NewsArticle extends BaseEntity {
    
    @NotBlank
    @Size(max = 200)
    @Column(name = "title", nullable = false)
    private String title;
    
    @NotBlank
    @Size(max = 500)
    @Column(name = "summary", nullable = false)
    private String summary;
    
    @NotBlank
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private SportCategory category;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ArticleStatus status = ArticleStatus.DRAFT;
    
    @Column(name = "tags")
    private String tags; // JSON array stored as string
    
    @Column(name = "source")
    private String source;
    
    @Column(name = "source_url")
    private String sourceUrl;
    
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;
    
    @Column(name = "is_breaking", nullable = false)
    private Boolean isBreaking = false;
    
    @Column(name = "is_trending", nullable = false)
    private Boolean isTrending = false;
    
    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;
    
    @Column(name = "ai_generated", nullable = false)
    private Boolean aiGenerated = false;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;
    
    @OneToMany(mappedBy = "article", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Comment> comments = new HashSet<>();
    
    @ManyToMany
    @JoinTable(
        name = "article_players",
        joinColumns = @JoinColumn(name = "article_id"),
        inverseJoinColumns = @JoinColumn(name = "player_id")
    )
    private Set<Player> relatedPlayers = new HashSet<>();
    
    public enum SportCategory {
        NBA, NFL, MLB, NHL, SOCCER, TENNIS, GOLF, OLYMPICS, COLLEGE, ESPORTS, ALL
    }
    
    public enum ArticleStatus {
        DRAFT, PUBLISHED, ARCHIVED, DELETED
    }
    
    public void incrementViewCount() {
        this.viewCount++;
    }
}
