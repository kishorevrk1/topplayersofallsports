package com.topplayersofallsports.backend.controller;

import com.topplayersofallsports.backend.service.ApiFootballService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Test controller for API integrations
 */
@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@Slf4j
public class TestController {

    @Autowired
    private ApiFootballService apiFootballService;

    /**
     * Test API-Football connection
     */
    @GetMapping("/api-football")
    public ResponseEntity<Map<String, Object>> testApiFootball() {
        try {
            log.info("Testing API-Football connection...");
            
            // Get fixtures for today
            LocalDate today = LocalDate.now();
            ApiFootballService.ApiFootballResponse<ApiFootballService.FixtureData> response = 
                apiFootballService.getFixturesByDateRange(today, today);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("timestamp", java.time.LocalDateTime.now().toString());
            result.put("apiUsageStats", apiFootballService.getApiUsageStats());
            
            if (response != null) {
                result.put("hasData", response.getResponse() != null);
                result.put("resultsCount", response.getResults());
                result.put("errors", response.getErrors());
                
                if (response.getResponse() != null && !response.getResponse().isEmpty()) {
                    result.put("sampleFixture", response.getResponse().get(0));
                }
            } else {
                result.put("hasData", false);
                result.put("message", "No response from API");
            }
            
            log.info("API-Football test completed successfully");
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error testing API-Football", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("timestamp", java.time.LocalDateTime.now().toString());
            result.put("apiUsageStats", apiFootballService.getApiUsageStats());
            
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * Test specific league fixtures
     */
    @GetMapping("/api-football/league/{leagueId}")
    public ResponseEntity<Map<String, Object>> testLeagueFixtures(@PathVariable Integer leagueId) {
        try {
            log.info("Testing API-Football for league {}...", leagueId);
            
            LocalDate today = LocalDate.now();
            LocalDate nextWeek = today.plusDays(7);
            
            ApiFootballService.ApiFootballResponse<ApiFootballService.FixtureData> response = 
                apiFootballService.getFixturesByLeagueAndDateRange(leagueId, today, nextWeek);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("leagueId", leagueId);
            result.put("dateRange", today + " to " + nextWeek);
            result.put("timestamp", java.time.LocalDateTime.now().toString());
            result.put("apiUsageStats", apiFootballService.getApiUsageStats());
            
            if (response != null) {
                result.put("hasData", response.getResponse() != null);
                result.put("resultsCount", response.getResults());
                result.put("errors", response.getErrors());
                
                if (response.getResponse() != null && !response.getResponse().isEmpty()) {
                    result.put("fixtures", response.getResponse());
                }
            } else {
                result.put("hasData", false);
                result.put("message", "No response from API");
            }
            
            log.info("League {} test completed successfully", leagueId);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error testing league {} fixtures", leagueId, e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("leagueId", leagueId);
            result.put("error", e.getMessage());
            result.put("timestamp", java.time.LocalDateTime.now().toString());
            
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * Get API usage statistics
     */
    @GetMapping("/api-stats")
    public ResponseEntity<Map<String, Object>> getApiStats() {
        Map<String, Object> result = new HashMap<>();
        result.put("apiFootball", apiFootballService.getApiUsageStats());
        result.put("timestamp", java.time.LocalDateTime.now().toString());
        
        return ResponseEntity.ok(result);
    }
}
