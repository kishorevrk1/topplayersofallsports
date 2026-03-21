package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class RatingDayResultsResponse {
    private Long ratingDayId;
    private String sport;
    private String month;
    private int totalVotes;
    private int totalVoters;
    private List<RankMover> biggestRisers;
    private List<RankMover> biggestFallers;
    private List<NewEntrant> newEntrants;

    @Data
    @Builder
    public static class RankMover {
        private Long playerId;
        private String playerName;
        private int rankBefore;
        private int rankAfter;
        private int rankChange;
        private double eloBefore;
        private double eloAfter;
    }

    @Data
    @Builder
    public static class NewEntrant {
        private Long playerId;
        private String playerName;
        private int rank;
        private String replacedPlayerName;
        private String aiReasoning;
    }
}
