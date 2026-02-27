package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "ai_analysis", indexes = {
    @Index(name = "idx_analysis_player", columnList = "player_id"),
    @Index(name = "idx_analysis_rating", columnList = "aiRating")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false, unique = true)
    private Player player;
    
    @Column(name = "ai_rating", nullable = false)
    private Integer aiRating; // 0-100
    
    @Column(columnDefinition = "TEXT")
    private String analysisText;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> strengths;
    
    @Column(columnDefinition = "TEXT")
    private String biography;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> careerHighlights; // Changed to List<String> for AI compatibility
    
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;
    
    @Column(name = "llm_model", length = 100)
    private String llmModel;
    
    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
    }
}
