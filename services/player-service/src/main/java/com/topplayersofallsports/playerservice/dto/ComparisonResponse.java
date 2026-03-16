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
        private Double score;
    }
}
