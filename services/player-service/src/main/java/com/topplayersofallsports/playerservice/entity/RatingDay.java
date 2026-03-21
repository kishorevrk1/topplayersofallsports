package com.topplayersofallsports.playerservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "rating_day",
       uniqueConstraints = @UniqueConstraint(columnNames = {"sport", "month"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Sport sport;

    @Column(nullable = false, length = 7)
    private String month; // "2026-03"

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.UPCOMING;

    @Column(name = "opens_at", nullable = false)
    private LocalDateTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private LocalDateTime closesAt;

    @Column(name = "total_votes", nullable = false)
    @Builder.Default
    private Integer totalVotes = 0;

    @Column(name = "total_voters", nullable = false)
    @Builder.Default
    private Integer totalVoters = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isActive() {
        return status == Status.ACTIVE;
    }

    public boolean isVotingOpen() {
        return status == Status.ACTIVE && LocalDateTime.now().isBefore(closesAt);
    }

    public enum Status {
        UPCOMING, ACTIVE, CLOSED, FINALIZED
    }
}
