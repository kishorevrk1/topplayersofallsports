package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "elo_matchup",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"rating_day_id", "voter_user_id", "player1_id", "player2_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EloMatchup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rating_day_id", nullable = false)
    private Long ratingDayId;

    @Column(name = "player1_id", nullable = false)
    private Long player1Id;

    @Column(name = "player2_id", nullable = false)
    private Long player2Id;

    @Column(name = "voter_user_id", nullable = false)
    private String voterUserId;

    @Column(name = "winner_id", nullable = false)
    private Long winnerId;

    @Column(name = "player1_elo_before", nullable = false)
    private Double player1EloBefore;

    @Column(name = "player2_elo_before", nullable = false)
    private Double player2EloBefore;

    @Column(name = "player1_elo_after", nullable = false)
    private Double player1EloAfter;

    @Column(name = "player2_elo_after", nullable = false)
    private Double player2EloAfter;

    @Column(name = "voted_at", nullable = false)
    @Builder.Default
    private LocalDateTime votedAt = LocalDateTime.now();
}
