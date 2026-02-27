package com.topplayersofallsports.news.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * News Article Entity
 * Stores sports news articles fetched from NewsAPI
 */
@Entity
@Table(name = "news_articles", indexes = {
    @Index(name = "idx_sport", columnList = "sport"),
    @Index(name = "idx_published_at", columnList = "published_at"),
    @Index(name = "idx_sport_published", columnList = "sport,published_at"),
    @Index(name = "idx_is_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "url", unique = true, nullable = false, length = 1000)
    private String url;
    
    @Column(name = "image_url", length = 1000)
    private String imageUrl;
    
    @Column(name = "source_name", length = 100)
    private String sourceName;
    
    @Column(name = "source_url", length = 500)
    private String sourceUrl;
    
    @Column(name = "author", length = 200)
    private String author;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Sport sport;
    
    @ElementCollection
    @CollectionTable(name = "news_article_tags", 
        joinColumns = @JoinColumn(name = "article_id"))
    @Column(name = "tag", length = 100)
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    
    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;
    
    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;
    
    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;
    
    @Column(name = "is_breaking")
    @Builder.Default
    private Boolean isBreaking = false;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (fetchedAt == null) {
            fetchedAt = now;
        }
        if (viewCount == null) {
            viewCount = 0;
        }
        if (isBreaking == null) {
            isBreaking = false;
        }
        if (isActive == null) {
            isActive = true;
        }
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    /**
     * Increment view count
     */
    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }
}
