package com.topplayersofallsports.highlights.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for player video counts by category.
 * Used in player profile videos tab to show counts per category.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerVideoCountsResponse {

    private Long highlights;
    private Long interviews;
    private Long training;
    private Long behindScenes;
    private Long fullGames;
    private Long documentaries;
    private Long total;

    /**
     * Calculate total from individual counts.
     */
    public Long calculateTotal() {
        return (highlights != null ? highlights : 0L) +
               (interviews != null ? interviews : 0L) +
               (training != null ? training : 0L) +
               (behindScenes != null ? behindScenes : 0L) +
               (fullGames != null ? fullGames : 0L) +
               (documentaries != null ? documentaries : 0L);
    }
}
