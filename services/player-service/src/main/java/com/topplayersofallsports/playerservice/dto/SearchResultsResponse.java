package com.topplayersofallsports.playerservice.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SearchResultsResponse {
    private List<PlayerSummary> players;
    private int total;
    private int page;
    private int pageSize;
    private String query;
}
