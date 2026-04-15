package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "ranking_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Sport sport;

    @Column(nullable = false, length = 7)
    private String month;

    @Column(name = "rank_before")
    private Integer rankBefore;

    @Column(name = "rank_after")
    private Integer rankAfter;

    @Column(name = "elo_before", nullable = false)
    private Double eloBefore;

    @Column(name = "elo_after", nullable = false)
    private Double eloAfter;

    @Column(name = "change_reason", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private ChangeReason changeReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ChangeReason {
        VOTE, NOMINATION, SEED
    }
}
