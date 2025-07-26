package com.topplayersofallsports.backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.EqualsAndHashCode;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Football fixture entity for storing match data from API-Football
 */
@Entity
@Table(name = "football_fixtures", indexes = {
    @Index(name = "idx_fixture_date", columnList = "fixtureDate"),
    @Index(name = "idx_fixture_league", columnList = "leagueName"),
    @Index(name = "idx_fixture_api_id", columnList = "apiFixtureId")
})
@Data
@EqualsAndHashCode(callSuper = true)
public class FootballFixture extends BaseEntity {

    @Column(unique = true, nullable = false)
    private Long apiFixtureId;

    @Column(nullable = false)
    private String homeTeam;

    @Column(nullable = false)
    private String awayTeam;

    private String homeTeamLogo;
    private String awayTeamLogo;

    @Column(nullable = false)
    private String leagueName;

    private Integer leagueId;
    private String leagueCountry;
    private String leagueLogo;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime fixtureDate;

    private String venue;
    private String venueCity;

    @Column(length = 50)
    private String status; // NS, 1H, 2H, FT, etc.

    private String round;
    private String season;

    // Score information (simplified for H2)
    private Integer homeScore;
    private Integer awayScore;
    private String scoreStatus; // halftime, fulltime, etc.

    // AI generated content
    @Column(length = 1000)
    private String aiDescription;

    private String aiHashtags; // comma-separated hashtags

    @Column(scale = 2)
    private Integer importanceScore = 1; // 1-5 scale

    @Column(length = 20)
    private String matchType; // regular, playoff, final, etc.

    // Broadcast information (simplified)
    private String broadcastChannels; // comma-separated channels

    // Cached data information
    @Column(nullable = false)
    private LocalDateTime cacheDate;

    @Column(nullable = false)
    private Boolean isLive = false;

    @Column(nullable = false)
    private Boolean aiProcessed = false;

    // Helper methods for hashtags
    public String[] getHashtagsArray() {
        return aiHashtags != null ? aiHashtags.split(",") : new String[0];
    }

    public void setHashtagsFromArray(String[] hashtags) {
        this.aiHashtags = String.join(",", hashtags);
    }

    // Helper methods for broadcast channels
    public String[] getBroadcastChannelsArray() {
        return broadcastChannels != null ? broadcastChannels.split(",") : new String[0];
    }

    public void setBroadcastChannelsFromArray(String[] channels) {
        this.broadcastChannels = String.join(",", channels);
    }
}
