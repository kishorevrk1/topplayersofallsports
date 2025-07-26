package com.topplayersofallsports.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Comment entity representing user comments on articles and videos
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "comments")
public class Comment extends BaseEntity {
    
    @NotBlank
    @Size(max = 1000)
    @Column(name = "content", nullable = false)
    private String content;
    
    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;
    
    @Column(name = "is_flagged", nullable = false)
    private Boolean isFlagged = false;
    
    @Column(name = "likes_count", nullable = false)
    private Long likesCount = 0L;
    
    @Column(name = "dislikes_count", nullable = false)
    private Long dislikesCount = 0L;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id")
    private NewsArticle article;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_id")
    private VideoHighlight video;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;
    
    public void incrementLikes() {
        this.likesCount++;
    }
    
    public void incrementDislikes() {
        this.dislikesCount++;
    }
}
