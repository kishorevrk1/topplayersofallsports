package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "player_stats", indexes = {
    @Index(name = "idx_stats_player", columnList = "player_id"),
    @Index(name = "idx_stats_season", columnList = "season")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;
    
    @Column(length = 20, nullable = false)
    private String season;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal ppg; // Points/Goals per game
    
    @Column(precision = 5, scale = 2)
    private BigDecimal rpg; // Rebounds/Assists
    
    @Column(precision = 5, scale = 2)
    private BigDecimal apg; // Assists/other stat
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> otherStats;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
