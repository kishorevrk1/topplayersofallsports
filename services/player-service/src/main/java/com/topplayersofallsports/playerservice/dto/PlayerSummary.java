package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerSummary {
    private Long id;
    private String name;
    private String sport;
    private String team;
    private String position;
    private String nationality;
    private Integer currentRank;
    private Double aiRating;
    private String photoUrl;
}
