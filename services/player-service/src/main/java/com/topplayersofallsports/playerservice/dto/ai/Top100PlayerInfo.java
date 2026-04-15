package com.topplayersofallsports.playerservice.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO for AI-generated top player information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Top100PlayerInfo {
    
    private Integer rank;           // 1-100
    private String name;            // Full name
    private String displayName;     // Common/nickname
    private String nationality;     // Country
    private String position;        // Playing position
    private String team;            // Current/last team (or "Retired")
    private Integer birthYear;      // Birth year
    private String height;          // Height
    private String weight;          // Weight
    private Boolean isActive;       // Still playing?
    private Integer rating;         // 0-100 AI rating
    private String biography;       // Career biography
    private List<String> careerHighlights;  // Major achievements
    private List<String> strengths; // Top skills
    private String legacySummary;   // One-liner legacy
    private String photoSearchTerm; // Term to search for player photo
}
