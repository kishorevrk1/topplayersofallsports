package com.topplayersofallsports.playerservice.dto;

import com.topplayersofallsports.playerservice.entity.Sport;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchRegistrationRequest {
    
    private Sport sport;                    // FOOTBALL, BASKETBALL, etc.
    private Integer count;                  // Number of players (default: 250)
    private String source;                  // "FIFA_RANKINGS", "AI_GENERATED", etc.
    private List<String> playerNames;       // Optional: explicit player list
    private Boolean skipExisting;           // Skip duplicate check (default: true)
    
    public int getCount() {
        return count != null ? count : 250;
    }
    
    public boolean isSkipExisting() {
        return skipExisting != null ? skipExisting : true;
    }
}
