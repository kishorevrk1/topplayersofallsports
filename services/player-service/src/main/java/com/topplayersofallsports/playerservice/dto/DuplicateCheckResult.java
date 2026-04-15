package com.topplayersofallsports.playerservice.dto;

import com.topplayersofallsports.playerservice.entity.Player;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateCheckResult {
    
    private boolean isDuplicate;
    private boolean needsReview;
    private Long matchedPlayerId;
    private String matchedPlayerName;
    private double confidence; // 0.0 to 1.0
    private String reason;
    private List<Player> possibleMatches;
    
    public static DuplicateCheckResult exactMatch(Long playerId, String playerName) {
        return DuplicateCheckResult.builder()
            .isDuplicate(true)
            .needsReview(false)
            .matchedPlayerId(playerId)
            .matchedPlayerName(playerName)
            .confidence(1.0)
            .reason("Exact canonical ID match")
            .build();
    }
    
    public static DuplicateCheckResult possibleMatch(List<Player> matches) {
        if (matches.isEmpty()) {
            return noDuplicate();
        }
        
        return DuplicateCheckResult.builder()
            .isDuplicate(false)
            .needsReview(true)
            .possibleMatches(matches)
            .confidence(0.7)
            .reason("Possible name match found - needs AI verification")
            .build();
    }
    
    public static DuplicateCheckResult fuzzyMatch(Player match, double similarity) {
        return DuplicateCheckResult.builder()
            .isDuplicate(true)
            .needsReview(false)
            .matchedPlayerId(match.getId())
            .matchedPlayerName(match.getName())
            .confidence(similarity)
            .reason("Fuzzy name match with " + String.format("%.0f%%", similarity * 100) + " similarity")
            .build();
    }
    
    public static DuplicateCheckResult noDuplicate() {
        return DuplicateCheckResult.builder()
            .isDuplicate(false)
            .needsReview(false)
            .confidence(0.0)
            .reason("No duplicate found")
            .build();
    }
    
    public static DuplicateCheckResult aiVerified(boolean isDupe, Long playerId, String playerName, double confidence, String reason) {
        return DuplicateCheckResult.builder()
            .isDuplicate(isDupe)
            .needsReview(false)
            .matchedPlayerId(playerId)
            .matchedPlayerName(playerName)
            .confidence(confidence)
            .reason("AI Verified: " + reason)
            .build();
    }
}
