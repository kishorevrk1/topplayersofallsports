package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "nomination",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"rating_day_id", "nominated_by_user_id", "sport"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Nomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rating_day_id", nullable = false)
    private Long ratingDayId;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Sport sport;

    @Column(name = "player_name", nullable = false)
    private String playerName;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "nominated_by_user_id", nullable = false)
    private String nominatedByUserId;

    @Column(name = "support_votes", nullable = false)
    @Builder.Default
    private Integer supportVotes = 0;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "replaces_player_id")
    private Long replacesPlayerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        PENDING, EVALUATING, APPROVED, REJECTED
    }
}
