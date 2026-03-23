package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "players", indexes = {
    @Index(name = "idx_player_sport", columnList = "sport"),
    @Index(name = "idx_player_api_id", columnList = "apiPlayerId"),
    @Index(name = "idx_player_name", columnList = "name"),
    @Index(name = "idx_player_normalized_name", columnList = "normalizedName,sport"),
    @Index(name = "idx_player_canonical_id", columnList = "canonicalId"),
    @Index(name = "idx_player_ranking", columnList = "sport,currentRank"),
    @Index(name = "idx_player_active", columnList = "sport,isActive,currentRank")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Player {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "api_player_id", unique = true, nullable = false)
    private String apiPlayerId;
    
    @Column(nullable = false)
    private String name; // Full official name
    
    @Column(name = "display_name")
    private String displayName; // Common/nickname
    
    @Column(name = "normalized_name")
    private String normalizedName; // Lowercase, no accents for fuzzy matching
    
    @Column(name = "canonical_id", unique = true)
    private String canonicalId; // SHA256 hash for deduplication
    
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "player_aliases", joinColumns = @JoinColumn(name = "player_id"))
    @Column(name = "alias")
    @Builder.Default
    private java.util.List<String> aliases = new java.util.ArrayList<>();
    
    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Sport sport;
    
    @Column(length = 255)
    private String team;
    
    @Column(length = 100)
    private String position;
    
    private Integer age;
    
    @Column(length = 20)
    private String height;
    
    @Column(length = 20)
    private String weight;
    
    @Column(columnDefinition = "TEXT")
    private String photoUrl;
    
    @Column(length = 100)
    private String nationality;
    
    private LocalDate birthdate;
    
    @Column(length = 255)
    private String birthplace;
    
    @Column(length = 255)
    private String college;
    
    // Ranking fields for Top 100 All-Time Greatest Players system
    @Column(name = "current_rank")
    private Integer currentRank; // 1-100, null if not in top 100
    
    @Column(name = "previous_rank")
    private Integer previousRank; // Track rank movement
    
    @Column(name = "ranking_score")
    private Double rankingScore; // AI-calculated score (0-100)

    @Column(name = "elo_score")
    @Builder.Default
    @JsonProperty("eloScore")
    private Double eloScore = 1500.0;

    @Column(name = "last_ranking_update")
    private LocalDateTime lastRankingUpdate; // When ranking was last updated
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true; // Still actively competing
    
    @Column(name = "performance_summary", columnDefinition = "TEXT")
    private String performanceSummary; // JSON or text summary of recent performance
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
