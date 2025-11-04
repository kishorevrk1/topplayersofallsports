package com.topplayersofallsports.highlights.api;

import com.topplayersofallsports.highlights.api.dto.HighlightResponse;
import com.topplayersofallsports.highlights.api.dto.PlayerVideoCountsResponse;
import com.topplayersofallsports.highlights.domain.model.Highlight;
import com.topplayersofallsports.highlights.service.HighlightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST API controller for video highlights.
 * 
 * Provides endpoints for:
 * - Video Highlights Hub (filtering, trending, featured)
 * - Player Profile Videos (by type, counts)
 * - Related videos
 * 
 * Production-ready with OpenAPI documentation and proper error handling.
 */
@RestController
@RequestMapping("/api/highlights")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Highlights", description = "Video highlights management API")
public class HighlightController {

    private final HighlightService highlightService;

    /**
     * Get highlights with filters and pagination.
     * Used by Video Highlights Hub.
     */
    @GetMapping
    @Operation(summary = "Get highlights with filters", 
               description = "Retrieve highlights filtered by sport, league, date range with pagination")
    public ResponseEntity<Page<HighlightResponse>> getHighlights(
        @Parameter(description = "Sport filter (e.g., basketball, football, soccer)")
        @RequestParam(required = false) String sport,
        
        @Parameter(description = "League ID filter")
        @RequestParam(required = false) String leagueId,
        
        @Parameter(description = "Start date (ISO 8601)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
        
        @Parameter(description = "End date (ISO 8601)")
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
        
        @Parameter(description = "Page number (0-indexed)")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size,
        
        @Parameter(description = "Sort field (publishedAt, viewCount, likeCount, trending)")
        @RequestParam(defaultValue = "publishedAt") String sort,
        
        @Parameter(description = "Sort direction (asc/desc)")
        @RequestParam(defaultValue = "desc") String direction
    ) {
        log.debug("GET /api/highlights - sport: {}, league: {}, page: {}, sort: {}", sport, leagueId, page, sort);
        
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) 
            ? Sort.Direction.ASC 
            : Sort.Direction.DESC;
        
        // Handle special sort options
        Sort sortBy;
        if ("trending".equalsIgnoreCase(sort)) {
            // Trending = sort by views + likes combined, recent first
            sortBy = Sort.by(sortDirection, "viewCount")
                .and(Sort.by(sortDirection, "likeCount"))
                .and(Sort.by(Sort.Direction.DESC, "publishedAt"));
        } else {
            sortBy = Sort.by(sortDirection, sort);
        }
        
        Pageable pageable = PageRequest.of(page, size, sortBy);
        
        Page<Highlight> highlights = highlightService.findWithFilters(
            sport, leagueId, startDate, endDate, pageable
        );
        
        Page<HighlightResponse> response = highlights.map(HighlightResponse::fromDomain);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Search highlights by query string.
     * Searches in title, description, and channel name.
     */
    @GetMapping("/search")
    @Operation(summary = "Search highlights", 
               description = "Search highlights by query string in title, description, and channel name")
    public ResponseEntity<Page<HighlightResponse>> searchHighlights(
        @Parameter(description = "Search query", required = true)
        @RequestParam String q,
        
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) String sport,
        
        @Parameter(description = "Page number (0-indexed)")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("GET /api/highlights/search - query: '{}', sport: {}, page: {}", q, sport, page);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Highlight> results = highlightService.searchHighlights(q, sport, pageable);
        Page<HighlightResponse> response = results.map(HighlightResponse::fromDomain);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get featured highlights for carousel.
     * Used by Video Highlights Hub featured section.
     */
    @GetMapping("/featured")
    @Operation(summary = "Get featured highlights", 
               description = "Retrieve featured highlights for carousel display")
    public ResponseEntity<List<HighlightResponse>> getFeatured(
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) String sport,
        
        @Parameter(description = "Maximum number of results")
        @RequestParam(defaultValue = "3") int limit
    ) {
        log.debug("GET /api/highlights/featured - sport: {}, limit: {}", sport, limit);
        
        List<Highlight> featured = highlightService.findFeatured(
            sport, 
            PageRequest.of(0, limit)
        );
        
        List<HighlightResponse> response = featured.stream()
            .map(HighlightResponse::fromDomain)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get trending highlights.
     * Used by Video Highlights Hub trending sidebar.
     */
    @GetMapping("/trending")
    @Operation(summary = "Get trending highlights", 
               description = "Retrieve trending highlights based on recent engagement")
    public ResponseEntity<List<HighlightResponse>> getTrending(
        @Parameter(description = "Sport filter (optional)")
        @RequestParam(required = false) String sport,
        
        @Parameter(description = "Maximum number of results")
        @RequestParam(defaultValue = "10") int limit
    ) {
        log.debug("GET /api/highlights/trending - sport: {}, limit: {}", sport, limit);
        
        List<Highlight> trending = highlightService.findTrending(sport, limit);
        
        List<HighlightResponse> response = trending.stream()
            .map(HighlightResponse::fromDomain)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get highlight by ID.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get highlight by ID", 
               description = "Retrieve a specific highlight by its ID")
    public ResponseEntity<HighlightResponse> getHighlightById(
        @Parameter(description = "Highlight ID")
        @PathVariable Long id
    ) {
        log.debug("GET /api/highlights/{}", id);
        
        return highlightService.findById(id)
            .map(HighlightResponse::fromDomain)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get player videos filtered by type.
     * Used by Player Profile Videos Tab.
     */
    @GetMapping("/player/{playerId}")
    @Operation(summary = "Get player videos", 
               description = "Retrieve videos for a specific player, optionally filtered by type")
    public ResponseEntity<Page<HighlightResponse>> getPlayerVideos(
        @Parameter(description = "Player ID")
        @PathVariable String playerId,
        
        @Parameter(description = "Video type filter (HIGHLIGHT, INTERVIEW, TRAINING, BEHIND_SCENES, etc.)")
        @RequestParam(required = false) Highlight.VideoType videoType,
        
        @Parameter(description = "Page number (0-indexed)")
        @RequestParam(defaultValue = "0") int page,
        
        @Parameter(description = "Page size")
        @RequestParam(defaultValue = "20") int size
    ) {
        log.debug("GET /api/highlights/player/{} - type: {}, page: {}", playerId, videoType, page);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "publishedAt"));
        
        Page<Highlight> playerVideos = highlightService.findByPlayerAndVideoType(
            playerId, videoType, pageable
        );
        
        Page<HighlightResponse> response = playerVideos.map(HighlightResponse::fromDomain);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get player video counts by type.
     * Used by Player Profile Videos Tab to show category counts.
     */
    @GetMapping("/player/{playerId}/counts")
    @Operation(summary = "Get player video counts", 
               description = "Get count of videos for each category for a specific player")
    public ResponseEntity<PlayerVideoCountsResponse> getPlayerVideoCounts(
        @Parameter(description = "Player ID")
        @PathVariable String playerId
    ) {
        log.debug("GET /api/highlights/player/{}/counts", playerId);
        
        Map<Highlight.VideoType, Long> counts = highlightService.countByPlayerGroupByVideoType(playerId);
        
        PlayerVideoCountsResponse response = PlayerVideoCountsResponse.builder()
            .highlights(counts.getOrDefault(Highlight.VideoType.HIGHLIGHT, 0L))
            .interviews(counts.getOrDefault(Highlight.VideoType.INTERVIEW, 0L))
            .training(counts.getOrDefault(Highlight.VideoType.TRAINING, 0L))
            .behindScenes(counts.getOrDefault(Highlight.VideoType.BEHIND_SCENES, 0L))
            .fullGames(counts.getOrDefault(Highlight.VideoType.FULL_GAME, 0L))
            .documentaries(counts.getOrDefault(Highlight.VideoType.DOCUMENTARY, 0L))
            .build();
        
        response.setTotal(response.calculateTotal());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get related videos for a highlight.
     * Used by Video Player Modal.
     */
    @GetMapping("/{id}/related")
    @Operation(summary = "Get related videos", 
               description = "Retrieve videos related to a specific highlight")
    public ResponseEntity<List<HighlightResponse>> getRelatedVideos(
        @Parameter(description = "Current video ID")
        @PathVariable Long id,
        
        @Parameter(description = "Maximum number of results")
        @RequestParam(defaultValue = "10") int limit
    ) {
        log.debug("GET /api/highlights/{}/related - limit: {}", id, limit);
        
        // Get current video to extract sport and entities
        Highlight currentVideo = highlightService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Video not found: " + id));
        
        // Extract entity IDs (teams, players) from current video
        List<String> entityIds = currentVideo.getEntities().stream()
            .map(entity -> entity.getEntityId())
            .collect(Collectors.toList());
        
        List<Highlight> related = highlightService.findRelated(
            id, 
            currentVideo.getSport(), 
            entityIds, 
            limit
        );
        
        List<HighlightResponse> response = related.stream()
            .map(HighlightResponse::fromDomain)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
}
