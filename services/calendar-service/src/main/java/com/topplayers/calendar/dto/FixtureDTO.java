package com.topplayers.calendar.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Fixture Data Transfer Object
 * Used for API responses to frontend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FixtureDTO {

    private Long id;
    
    @JsonProperty("externalId")
    private Long externalId;

    // Sport Type
    @JsonProperty("sport")
    private String sport;

    // League Information
    @JsonProperty("league")
    private LeagueInfo league;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeagueInfo {
        private Integer id;
        private String name;
        private String country;
        private String logo;
    }

    // Date and Time
    @JsonProperty("fixtureDate")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fixtureDate;

    @JsonProperty("timezone")
    private String timezone;

    // Venue
    @JsonProperty("venue")
    private VenueInfo venue;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VenueInfo {
        private String name;
        private String city;
    }

    // Teams
    @JsonProperty("homeTeam")
    private TeamInfo homeTeam;

    @JsonProperty("awayTeam")
    private TeamInfo awayTeam;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamInfo {
        private Integer id;
        private String name;
        private String logo;
    }

    // Status
    @JsonProperty("status")
    private String status;

    @JsonProperty("statusLong")
    private String statusLong;

    @JsonProperty("elapsedTime")
    private Integer elapsedTime;

    @JsonProperty("isLive")
    private Boolean isLive;

    // Scores
    @JsonProperty("homeScore")
    private Integer homeScore;

    @JsonProperty("awayScore")
    private Integer awayScore;

    @JsonProperty("scoreDetails")
    private String scoreDetails;

    // Additional Info
    @JsonProperty("referee")
    private String referee;

    @JsonProperty("season")
    private String season;

    @JsonProperty("round")
    private String round;
}
