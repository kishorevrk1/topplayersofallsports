package com.topplayersofallsports.playerservice.temporal.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Result of batch player updates
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchUpdateResult {
    
    private int totalPlayers;
    private int successCount;
    private int failureCount;
    
    private List<PlayerUpdateResult> results;
    
    private String summary;
    private java.time.LocalDateTime completedAt;
}
