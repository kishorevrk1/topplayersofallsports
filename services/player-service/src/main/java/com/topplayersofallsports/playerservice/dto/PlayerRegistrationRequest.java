package com.topplayersofallsports.playerservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerRegistrationRequest {
    
    @NotBlank(message = "Player name is required")
    private String playerName;
    
    private String sport; // Optional - AI will detect if not provided
    
    private String team; // Optional hint
    
    private String nationality; // Optional hint
    
    private String additionalInfo; // Any extra context from user
}
