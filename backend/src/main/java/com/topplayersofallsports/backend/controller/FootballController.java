package com.topplayersofallsports.backend.controller;

import com.topplayersofallsports.backend.model.FootballFixture;
import com.topplayersofallsports.backend.service.FootballDataService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for Football data API
 */
@RestController
@RequestMapping("/api/football")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"}) // React dev servers
@Slf4j
public class FootballController {

    @Autowired
    private FootballDataService footballDataService;

    /**
     * Get today's fixtures
     */
    @GetMapping("/fixtures/today")
    public ResponseEntity<ApiResponse<List<FootballFixture>>> getTodaysFixtures() {
        try {
            List<FootballFixture> fixtures = footballDataService.getTodaysFixtures();
            return ResponseEntity.ok(ApiResponse.success(fixtures, fixtures.size() + " fixtures found"));
        } catch (Exception e) {
            log.error("Error getting today's fixtures", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error retrieving today's fixtures"));
        }
    }

    /**
     * Get fixtures by date range
     */
    @GetMapping("/fixtures")
    public ResponseEntity<ApiResponse<List<FootballFixture>>> getFixtures(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String league) {
        
        try {
            List<FootballFixture> fixtures;
            
            if (league != null && !league.trim().isEmpty()) {
                fixtures = footballDataService.getFixturesByDateRangeAndLeague(from, to, league);
            } else {
                fixtures = footballDataService.getFixturesByDateRange(from, to);
            }
            
            return ResponseEntity.ok(ApiResponse.success(fixtures, 
                fixtures.size() + " fixtures found for date range"));
                
        } catch (Exception e) {
            log.error("Error getting fixtures by date range", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error retrieving fixtures"));
        }
    }

    /**
     * Search fixtures
     */
    @GetMapping("/fixtures/search")
    public ResponseEntity<ApiResponse<List<FootballFixture>>> searchFixtures(
            @RequestParam String query) {
        
        try {
            if (query == null || query.trim().length() < 2) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Query must be at least 2 characters"));
            }
            
            List<FootballFixture> fixtures = footballDataService.searchFixtures(query.trim());
            return ResponseEntity.ok(ApiResponse.success(fixtures, 
                fixtures.size() + " fixtures found for query: " + query));
                
        } catch (Exception e) {
            log.error("Error searching fixtures", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error searching fixtures"));
        }
    }

    /**
     * Get fixtures grouped by league
     */
    @GetMapping("/fixtures/by-league")
    public ResponseEntity<ApiResponse<Map<String, List<FootballFixture>>>> getFixturesGroupedByLeague(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        
        try {
            List<FootballFixture> fixtures = footballDataService.getFixturesByDateRange(from, to);
            
            Map<String, List<FootballFixture>> groupedFixtures = fixtures.stream()
                .collect(Collectors.groupingBy(FootballFixture::getLeagueName));
            
            return ResponseEntity.ok(ApiResponse.success(groupedFixtures, 
                groupedFixtures.size() + " leagues found"));
                
        } catch (Exception e) {
            log.error("Error getting fixtures grouped by league", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error retrieving fixtures by league"));
        }
    }

    /**
     * Get live fixtures
     */
    @GetMapping("/fixtures/live")
    public ResponseEntity<ApiResponse<List<FootballFixture>>> getLiveFixtures() {
        try {
            // For now, return fixtures with live status
            List<FootballFixture> fixtures = footballDataService.getTodaysFixtures()
                .stream()
                .filter(FootballFixture::getIsLive)
                .collect(Collectors.toList());
                
            return ResponseEntity.ok(ApiResponse.success(fixtures, 
                fixtures.size() + " live fixtures found"));
                
        } catch (Exception e) {
            log.error("Error getting live fixtures", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error retrieving live fixtures"));
        }
    }

    /**
     * Get API usage statistics
     */
    @GetMapping("/stats/usage")
    public ResponseEntity<ApiResponse<FootballDataService.ApiUsageStats>> getApiUsageStats() {
        try {
            FootballDataService.ApiUsageStats stats = footballDataService.getApiUsageStats();
            return ResponseEntity.ok(ApiResponse.success(stats, "Usage statistics retrieved"));
        } catch (Exception e) {
            log.error("Error getting API usage stats", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error retrieving usage statistics"));
        }
    }

    /**
     * Manual data sync trigger (for development)
     */
    @PostMapping("/sync/manual")
    public ResponseEntity<ApiResponse<String>> manualDataSync() {
        try {
            // Trigger async data sync
            footballDataService.processFixturesWithAi();
            
            return ResponseEntity.ok(ApiResponse.success("sync-triggered", 
                "Manual data sync triggered successfully"));
                
        } catch (Exception e) {
            log.error("Error triggering manual sync", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error triggering manual sync"));
        }
    }

    /**
     * Get fixture by ID
     */
    @GetMapping("/fixtures/{id}")
    public ResponseEntity<ApiResponse<FootballFixture>> getFixtureById(@PathVariable Long id) {
        try {
            // This would need to be implemented in the service
            return ResponseEntity.status(501)
                .body(ApiResponse.error("Feature not implemented yet"));
                
        } catch (Exception e) {
            log.error("Error getting fixture by ID", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error retrieving fixture"));
        }
    }

    // API Response wrapper
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
        private String timestamp;
        
        public static <T> ApiResponse<T> success(T data, String message) {
            return new ApiResponse<>(true, message, data, 
                java.time.LocalDateTime.now().toString());
        }
        
        public static <T> ApiResponse<T> error(String message) {
            return new ApiResponse<>(false, message, null, 
                java.time.LocalDateTime.now().toString());
        }
    }
}
