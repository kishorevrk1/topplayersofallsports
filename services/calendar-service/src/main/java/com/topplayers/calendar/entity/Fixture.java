package com.topplayers.calendar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Fixture Entity - Football Match
 * Stores match information from API-Sports.io
 */
@Entity
@Table(name = "fixtures", 
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_external_id_sport", columnNames = {"externalId", "sport"})
    },
    indexes = {
        @Index(name = "idx_fixture_date", columnList = "fixtureDate"),
        @Index(name = "idx_sport_date", columnList = "sport,fixtureDate"),
        @Index(name = "idx_league_season", columnList = "leagueId,season"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_is_live", columnList = "isLive"),
        @Index(name = "idx_sport", columnList = "sport")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Fixture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long externalId; // API-Sports.io fixture ID

    // Sport Type
    @Column(nullable = false, length = 50)
    private String sport; // football, basketball, hockey, baseball, nfl

    // League Information
    @Column(nullable = false)
    private Integer leagueId;

    @Column(nullable = false)
    private String leagueName;

    @Column
    private String leagueCountry;

    @Column(length = 500)
    private String leagueLogo;

    @Column(nullable = false, length = 20)
    private String season; // Changed to String for flexibility (e.g., "2024-2025")

    @Column
    private String round;

    // Date and Time
    @Column(nullable = false)
    private LocalDateTime fixtureDate;

    @Column
    private String timezone;

    @Column
    private String venue;

    @Column
    private String venueCity;

    // Teams
    @Column(nullable = false)
    private Integer homeTeamId;

    @Column(nullable = false)
    private String homeTeamName;

    @Column
    private String homeTeamLogo;

    @Column(nullable = false)
    private Integer awayTeamId;

    @Column(nullable = false)
    private String awayTeamName;

    @Column
    private String awayTeamLogo;

    // Status
    @Column(nullable = false)
    private String status; // NS, LIVE, FT, etc.

    @Column
    private String statusLong;

    @Column
    private Integer elapsedTime;

    @Column
    private Boolean isLive;

    // Scores
    @Column
    private Integer homeScore;

    @Column
    private Integer awayScore;

    @Column(columnDefinition = "TEXT")
    private String scoreDetails; // JSON string for detailed scores

    // Additional Info
    @Column
    private String referee;

    // Metadata
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
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

    /**
     * Check if fixture is upcoming
     */
    public boolean isUpcoming() {
        return "NS".equals(status) || "TBD".equals(status);
    }

    /**
     * Check if fixture is finished
     */
    public boolean isFinished() {
        return "FT".equals(status) || "AET".equals(status) || 
               "PEN".equals(status) || "CANC".equals(status);
    }

    /**
     * Check if fixture is today
     */
    public boolean isToday() {
        return fixtureDate.toLocalDate().equals(LocalDateTime.now().toLocalDate());
    }
}
