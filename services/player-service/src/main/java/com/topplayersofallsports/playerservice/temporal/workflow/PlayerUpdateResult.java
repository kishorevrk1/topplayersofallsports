package com.topplayersofallsports.playerservice.temporal.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of a player rating update
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerUpdateResult {
    
    private Long playerId;
    private String playerName;
    private boolean success;
    
    // Rating changes
    private Integer oldRating;
    private Integer newRating;
    private Integer ratingChange;  // +5, -3, etc.
    
    // What changed
    private String changeReason;
    private String updatedStats;
    
    // Metadata
    private String message;
    private java.time.LocalDateTime updatedAt;
}
