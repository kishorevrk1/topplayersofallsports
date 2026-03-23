package com.topplayersofallsports.news.api;

import com.topplayersofallsports.news.api.dto.TrendingPlayerDTO;
import com.topplayersofallsports.news.api.dto.TrendingTopicDTO;
import com.topplayersofallsports.news.domain.model.Sport;
import com.topplayersofallsports.news.service.TrendingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for trending topics and players
 */
@Slf4j
@RestController
@RequestMapping("/api/news/trending")
@RequiredArgsConstructor
@Tag(name = "Trending", description = "Trending topics and players API")
public class TrendingController {
    
    private final TrendingService trendingService;
    
    /**
     * Get trending topics
     */
    @GetMapping("/topics")
    @Operation(
        summary = "Get trending topics",
        description = "Get trending topics based on article mentions and views in the last N hours"
    )
    public ResponseEntity<List<TrendingTopicDTO>> getTrendingTopics(
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) Sport sport,
        
        @Parameter(description = "Time window in hours")
        @RequestParam(defaultValue = "24") int hours,
        
        @Parameter(description = "Maximum number of results")
        @RequestParam(defaultValue = "10") int limit
    ) {
        log.debug("GET /api/news/trending/topics - sport: {}, hours: {}, limit: {}", sport, hours, limit);
        
        List<TrendingTopicDTO> trending = trendingService.getTrendingTopics(sport, hours, limit);
        
        return ResponseEntity.ok(trending);
    }
    
    /**
     * Get trending players
     */
    @GetMapping("/players")
    @Operation(
        summary = "Get trending players",
        description = "Get trending players based on article mentions and views in the last N hours"
    )
    public ResponseEntity<List<TrendingPlayerDTO>> getTrendingPlayers(
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) Sport sport,
        
        @Parameter(description = "Time window in hours")
        @RequestParam(defaultValue = "24") int hours,
        
        @Parameter(description = "Maximum number of results")
        @RequestParam(defaultValue = "10") int limit
    ) {
        log.debug("GET /api/news/trending/players - sport: {}, hours: {}, limit: {}", sport, hours, limit);
        
        List<TrendingPlayerDTO> trending = trendingService.getTrendingPlayers(sport, hours, limit);
        
        return ResponseEntity.ok(trending);
    }
}
