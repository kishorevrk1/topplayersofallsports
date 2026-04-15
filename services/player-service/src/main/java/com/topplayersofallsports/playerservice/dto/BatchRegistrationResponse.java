package com.topplayersofallsports.playerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRegistrationResponse {
    
    private String workflowId;
    private String status;                  // RUNNING, COMPLETED, FAILED
    private String sport;
    private Integer totalPlayers;           // Total requested
    private Integer registered;             // Successfully registered
    private Integer skipped;                // Already exists
    private Integer failed;                 // Failed to register
    private List<String> registeredPlayers; // Names of registered players
    private List<String> failedPlayers;     // Names of failed players
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String message;
    private String errorMessage;
    
    // Progress tracking
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Progress {
        private Integer total;
        private Integer completed;
        private Integer inProgress;
        private Integer pending;
        private Integer percentage;
    }
    
    private Progress progress;
}
