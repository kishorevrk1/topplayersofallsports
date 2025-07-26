package com.topplayersofallsports.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * UserFavorite entity representing user's favorite items (players, articles, videos)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "user_favorites")
public class UserFavorite extends BaseEntity {
    
    @Enumerated(EnumType.STRING)
    @Column(name = "favorite_type", nullable = false)
    private FavoriteType favoriteType;
    
    @Column(name = "entity_id", nullable = false)
    private Long entityId;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    public enum FavoriteType {
        PLAYER, ARTICLE, VIDEO, TEAM
    }
}
