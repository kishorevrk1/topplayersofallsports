package com.topplayers.calendar.controller;

import com.topplayers.calendar.dto.FixtureDTO;
import com.topplayers.calendar.service.FixtureService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Fixture REST Controller
 * API endpoints for football fixtures
 */
@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Fixtures", description = "Football Fixtures API")
@CrossOrigin(origins = "*")
public class FixtureController {

    private final FixtureService fixtureService;

    /**
     * Get fixtures for a specific date
     * GET /api/calendar/fixtures?date=YYYY-MM-DD
     */
    @GetMapping("/fixtures")
    @Operation(summary = "Get fixtures by date", 
               description = "Get all football fixtures for a specific date across all top leagues")
    public ResponseEntity<List<FixtureDTO>> getFixturesByDate(
            @Parameter(description = "Date in YYYY-MM-DD format")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
            LocalDate date,
            @Parameter(description = "Sport filter (ignored - service is football-only)")
            @RequestParam(required = false)
            String sport) {
        
        LocalDate targetDate = date != null ? date : LocalDate.now();
        log.info("GET /api/calendar/fixtures - date: {}, sport: {} (football-only service)", targetDate, sport);
        
        try {
            List<FixtureDTO> fixtures = fixtureService.getFixturesByDate(targetDate);
            return ResponseEntity.ok(fixtures != null ? fixtures : List.of());
        } catch (Exception e) {
            log.error("Error fetching fixtures for date {}: {}", targetDate, e.getMessage(), e);
            return ResponseEntity.ok(List.of()); // Return empty list instead of 500
        }
    }

    /**
     * Get top 3 matches for today
     * GET /api/calendar/fixtures/top3
     */
    @GetMapping("/fixtures/top3")
    @Operation(summary = "Get top 3 matches", 
               description = "Get top 3 football matches for today by league priority")
    public ResponseEntity<List<FixtureDTO>> getTop3TodaysMatches() {
        log.info("GET /api/calendar/fixtures/top3");
        
        List<FixtureDTO> fixtures = fixtureService.getTop3TodaysMatches();
        return ResponseEntity.ok(fixtures);
    }

    /**
     * Get top 3 matches for specific date
     * GET /api/calendar/fixtures/top3/{date}
     */
    @GetMapping("/fixtures/top3/{date}")
    @Operation(summary = "Get top 3 matches by date", 
               description = "Get top 3 football matches for a specific date")
    public ResponseEntity<List<FixtureDTO>> getTop3MatchesByDate(
            @Parameter(description = "Date in YYYY-MM-DD format")
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("GET /api/calendar/fixtures/top3/{}", date);
        
        List<FixtureDTO> fixtures = fixtureService.getTop3MatchesByDate(date);
        return ResponseEntity.ok(fixtures);
    }

    /**
     * Get live fixtures
     * GET /api/calendar/fixtures/live
     */
    @GetMapping("/fixtures/live")
    @Operation(summary = "Get live fixtures", 
               description = "Get all currently live matches")
    public ResponseEntity<List<FixtureDTO>> getLiveFixtures() {
        log.info("GET /api/calendar/fixtures/live");
        
        try {
            List<FixtureDTO> fixtures = fixtureService.getLiveFixtures();
            return ResponseEntity.ok(fixtures != null ? fixtures : List.of());
        } catch (Exception e) {
            log.error("Error fetching live fixtures: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }
    
    /**
     * Get recent finished matches
     * GET /api/calendar/fixtures/recent?sport=football&days=7
     */
    @GetMapping("/fixtures/recent")
    @Operation(summary = "Get recent finished matches", 
               description = "Get recently finished matches (last N days)")
    public ResponseEntity<List<FixtureDTO>> getRecentMatches(
            @Parameter(description = "Sport filter (football, basketball, or all)")
            @RequestParam(required = false, defaultValue = "all") String sport,
            @Parameter(description = "Number of days to look back")
            @RequestParam(required = false, defaultValue = "7") int days) {
        
        log.info("GET /api/calendar/fixtures/recent - sport: {}, days: {}", sport, days);
        
        try {
            List<FixtureDTO> fixtures = fixtureService.getRecentFinishedMatches(sport, days);
            return ResponseEntity.ok(fixtures != null ? fixtures : List.of());
        } catch (Exception e) {
            log.error("Error fetching recent fixtures: {}", e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }
    
    /**
     * Get matches by specific date
     * GET /api/calendar/fixtures/date/2024-11-23?sport=football
     */
    @GetMapping("/fixtures/date/{date}")
    @Operation(summary = "Get matches by date", 
               description = "Get all matches for a specific date")
    public ResponseEntity<List<FixtureDTO>> getMatchesByDate(
            @Parameter(description = "Date in YYYY-MM-DD format")
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Parameter(description = "Sport filter (football, basketball, or all)")
            @RequestParam(required = false, defaultValue = "all") String sport) {
        
        log.info("GET /api/calendar/fixtures/date/{} - sport: {}", date, sport);
        
        try {
            List<FixtureDTO> fixtures = fixtureService.getMatchesByDate(sport, date);
            return ResponseEntity.ok(fixtures != null ? fixtures : List.of());
        } catch (Exception e) {
            log.error("Error fetching fixtures for date {}: {}", date, e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Get fixtures by date range
     * GET /api/calendar/fixtures/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     */
    @GetMapping("/fixtures/range")
    @Operation(summary = "Get fixtures by date range", 
               description = "Get all football fixtures within a date range")
    public ResponseEntity<List<FixtureDTO>> getFixturesByDateRange(
            @Parameter(description = "Start date in YYYY-MM-DD format")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "End date in YYYY-MM-DD format")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("GET /api/calendar/fixtures/range - start: {}, end: {}", startDate, endDate);
        
        try {
            List<FixtureDTO> fixtures = fixtureService.getFixturesByDateRange(startDate, endDate);
            return ResponseEntity.ok(fixtures != null ? fixtures : List.of());
        } catch (Exception e) {
            log.error("Error fetching fixtures range {}-{}: {}", startDate, endDate, e.getMessage(), e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Sync fixtures for a specific date (Admin endpoint)
     * POST /api/calendar/admin/sync?date=YYYY-MM-DD
     */
    @PostMapping("/admin/sync")
    @Operation(summary = "Sync fixtures (Admin)", 
               description = "Manually trigger fixture sync from API-Sports.io for a specific date")
    public ResponseEntity<String> syncFixtures(
            @Parameter(description = "Date in YYYY-MM-DD format")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
            LocalDate date) {
        
        LocalDate targetDate = date != null ? date : LocalDate.now();
        log.info("POST /api/calendar/admin/sync - date: {}", targetDate);
        
        fixtureService.syncFixturesForDate(targetDate);
        return ResponseEntity.ok("Sync completed for " + targetDate);
    }

    /**
     * Sync fixtures for date range (Admin endpoint)
     * POST /api/calendar/admin/sync/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     */
    @PostMapping("/admin/sync/range")
    @Operation(summary = "Sync fixtures range (Admin)", 
               description = "Manually trigger fixture sync for a date range")
    public ResponseEntity<String> syncFixturesRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("POST /api/calendar/admin/sync/range - start: {}, end: {}", startDate, endDate);
        
        fixtureService.syncFixturesForDateRange(startDate, endDate);
        return ResponseEntity.ok(String.format("Sync completed from %s to %s", startDate, endDate));
    }

    /**
     * Update live fixtures (Admin endpoint)
     * POST /api/calendar/admin/live/update
     */
    @PostMapping("/admin/live/update")
    @Operation(summary = "Update live fixtures (Admin)", 
               description = "Manually trigger live fixture updates")
    public ResponseEntity<String> updateLiveFixtures() {
        log.info("POST /api/calendar/admin/live/update");
        
        fixtureService.updateLiveFixtures();
        return ResponseEntity.ok("Live fixtures updated");
    }

    /**
     * Health check
     * GET /api/calendar/health
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if service is healthy")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Calendar Service is healthy");
    }
}
