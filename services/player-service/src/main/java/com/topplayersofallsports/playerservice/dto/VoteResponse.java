package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VoteResponse {
    private Double player1EloAfter;
    private Double player2EloAfter;
    private Double player1EloChange;
    private Double player2EloChange;
    private MatchupResponse nextMatchup; // null if no more matchups
}
