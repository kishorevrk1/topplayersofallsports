package com.topplayersofallsports.playerservice.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerSearchResult {
    
    private String fullName;
    
    private String commonName;
    
    private String sport; // FOOTBALL, BASKETBALL, etc.
    
    private String currentTeam;
    
    private String nationality;
    
    private String position;
    
    private String searchQuery; // Suggested search query for API-Sports
    
    private Integer estimatedAge;
    
    private String careerSummary;
    
    private boolean isActivePlayer;
}
