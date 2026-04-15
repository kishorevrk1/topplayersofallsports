package com.topplayersofallsports.playerservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerRegistrationResponse {
    
    private boolean success;
    
    private String message;
    
    private Long playerId; // ID of registered player
    
    private String playerName;
    
    private String sport;
    
    private Integer aiRating;
    
    private String status; // "NEW", "ALREADY_EXISTS", "PENDING", "FAILED"
    
    private String errorMessage;
}
