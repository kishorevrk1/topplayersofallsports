package com.topplayersofallsports.playerservice.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Response wrapper for AI-generated Top 100 list
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Top100Response {
    
    private String sport;
    private Integer totalPlayers;
    private String generatedFor;  // "All-Time Greatest up to 2025"
    private List<Top100PlayerInfo> players;
}
