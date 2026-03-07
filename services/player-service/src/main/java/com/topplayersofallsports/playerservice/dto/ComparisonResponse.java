package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ComparisonResponse {

    private PlayerSnapshot player1;
    private PlayerSnapshot player2;

    @Data
    @Builder
    public static class PlayerSnapshot {
        private Long id;
        private String name;
        private String displayName;
        private String sport;
        private String team;
        private String position;
        private String nationality;
        private Integer age;
        private String photoUrl;
        private Boolean isActive;

        // ACR rating data (null if not yet rated)
        private Double consensusScore;
        private String confidenceLevel;
        private Double model1Score;
        private Double model2Score;
        private Double divergenceScore;
        /** JSON string: {"peakPerformance": 28.5, "longevity": 18.2, ...} */
        private String criteriaBreakdown;
    }
}
