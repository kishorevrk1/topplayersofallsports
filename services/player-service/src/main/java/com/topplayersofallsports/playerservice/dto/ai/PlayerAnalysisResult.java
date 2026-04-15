package com.topplayersofallsports.playerservice.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerAnalysisResult {
    
    private Integer rating; // 0-100
    private String analysis;
    private List<String> strengths;
    private String biography;
    private List<String> careerHighlights; // Changed to List<String> for AI compatibility
    private String legacySummary;
}
