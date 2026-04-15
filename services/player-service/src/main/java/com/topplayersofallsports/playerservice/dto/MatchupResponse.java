package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MatchupResponse {
    private Long player1Id;
    private String player1Name;
    private String player1DisplayName;
    private String player1PhotoUrl;
    private String player1Position;
    private String player1Nationality;
    private Integer player1Rank;
    private Double player1Elo;
    private String player1Team;

    private Long player2Id;
    private String player2Name;
    private String player2DisplayName;
    private String player2PhotoUrl;
    private String player2Position;
    private String player2Nationality;
    private Integer player2Rank;
    private Double player2Elo;
    private String player2Team;

    private int matchNumber;
    private int maxMatches;
}
