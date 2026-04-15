package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class PlayerStatsResponse {
    private Long playerId;
    private Map<String, Map<String, Object>> seasonStats;
    private Map<String, Object> careerStats;
}
