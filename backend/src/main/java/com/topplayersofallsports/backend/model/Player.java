package com.topplayersofallsports.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/**
 * Player entity representing sports players
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "players")
public class Player extends BaseEntity {
    
    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false)
    private String name;
    
    @NotBlank
    @Size(max = 50)
    @Column(name = "position", nullable = false)
    private String position;
    
    @NotBlank
    @Size(max = 100)
    @Column(name = "team", nullable = false)
    private String team;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "sport", nullable = false)
    private SportType sport;
    
    @Column(name = "jersey_number")
    private Integer jerseyNumber;
    
    @Column(name = "height")
    private String height; // e.g., "6'2\""
    
    @Column(name = "weight")
    private String weight; // e.g., "180 lbs"
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Column(name = "birth_place")
    private String birthPlace;
    
    @Column(name = "nationality")
    private String nationality;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(name = "biography", columnDefinition = "TEXT")
    private String biography;
    
    @Column(name = "career_stats", columnDefinition = "TEXT")
    private String careerStats; // JSON stored as string
    
    @Column(name = "season_stats", columnDefinition = "TEXT")
    private String seasonStats; // JSON stored as string
    
    @Column(name = "achievements", columnDefinition = "TEXT")
    private String achievements; // JSON stored as string
    
    @Column(name = "social_links", columnDefinition = "TEXT")
    private String socialLinks; // JSON stored as string
    
    @Column(name = "salary")
    private String salary;
    
    @Column(name = "contract_until")
    private LocalDate contractUntil;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = false;
    
    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;
    
    // Relationships
    @ManyToMany(mappedBy = "relatedPlayers")
    private Set<NewsArticle> articles = new HashSet<>();
    
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<VideoHighlight> videoHighlights = new HashSet<>();
    
    public enum SportType {
        BASKETBALL, FOOTBALL, BASEBALL, HOCKEY, SOCCER, TENNIS, GOLF, ESPORTS
    }
    
    public void incrementViewCount() {
        this.viewCount++;
    }
    
    public Integer getAge() {
        if (birthDate != null) {
            return LocalDate.now().getYear() - birthDate.getYear();
        }
        return null;
    }
}
