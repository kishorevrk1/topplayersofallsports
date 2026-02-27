package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.service.DataCleanupService;
import com.topplayersofallsports.playerservice.service.PlayerDisplayNameService;
import com.topplayersofallsports.playerservice.service.PlayerRankingService;
import com.topplayersofallsports.playerservice.service.PlayerService;
import com.topplayersofallsports.playerservice.service.Top100SeedingService;
import com.topplayersofallsports.playerservice.temporal.workflow.AllSportsRankingWorkflow;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerEnrichmentWorkflow;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerRankingWorkflow;
import com.topplayersofallsports.playerservice.temporal.workflow.SportEnrichmentWorkflow;
import io.swagger.v3.oas.annotations.Operation;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/admin/players")
@Slf4j
@Tag(name = "Admin", description = "Admin endpoints for player data management")
public class AdminController {
    
    private final PlayerService playerService;
    private final PlayerDisplayNameService displayNameService;
    private final PlayerRankingService rankingService;
    private final DataCleanupService dataCleanupService;
    private final Top100SeedingService top100SeedingService;
    private final PlayerRepository playerRepository;
    
    @Autowired(required = false)
    private WorkflowClient workflowClient;
    
    public AdminController(PlayerService playerService, 
                          PlayerDisplayNameService displayNameService,
                          PlayerRankingService rankingService,
                          DataCleanupService dataCleanupService,
                          Top100SeedingService top100SeedingService,
                          PlayerRepository playerRepository) {
        this.playerService = playerService;
        this.displayNameService = displayNameService;
        this.rankingService = rankingService;
        this.dataCleanupService = dataCleanupService;
        this.top100SeedingService = top100SeedingService;
        this.playerRepository = playerRepository;
    }
    
    @PostMapping("/sync/football")
    @Operation(summary = "Manually sync football players")
    public ResponseEntity<Map<String, Object>> syncFootballPlayers(
            @RequestParam(defaultValue = "2024") int season,
            @RequestParam(defaultValue = "10") int playersPerLeague) {
        log.info("Admin request to sync football players: season={}, playersPerLeague={}", 
            season, playersPerLeague);
        
        try {
            int synced = playerService.syncFootballPlayers(season, playersPerLeague);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Football players synced successfully",
                "playersSync", synced,
                "season", season
            ));
        } catch (Exception e) {
            log.error("Error syncing football players: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Get sync statistics")
    public ResponseEntity<String> getSyncStats() {
        log.info("Admin request to get sync statistics");
        String stats = playerService.getSyncStats();
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/backfill/display-names")
    @Operation(summary = "Backfill proper display names using AI",
               description = "Uses AI to get commonly used names for all players (e.g., Messi, Ronaldo, etc.)")
    public ResponseEntity<Map<String, Object>> backfillDisplayNames() {
        log.info("Admin request to backfill display names with AI");
        
        try {
            // Trigger async backfill (managed by Spring's @Async)
            displayNameService.backfillAllDisplayNamesAsync();
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "message", "Display name backfill started in background",
                "note", "This will take 2-3 seconds per player due to AI API calls. Check logs for progress."
            ));
        } catch (Exception e) {
            log.error("Error starting display name backfill: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/rankings/initialize/{sport}")
    @Operation(summary = "Initialize top 50 players for a sport via Temporal",
               description = "Triggers a Temporal workflow to fetch and store top 50 players using AI")
    public ResponseEntity<Map<String, Object>> initializeTop50(
            @PathVariable String sport) {
        log.info("Admin request to initialize top 50 for {} via Temporal", sport);
        
        if (workflowClient == null) {
            return ResponseEntity.status(503).body(Map.of(
                "success", false,
                "error", "Temporal workflows are disabled",
                "hint", "Set temporal.enabled=true and ensure Temporal server is running"
            ));
        }
        
        try {
            Sport sportEnum = Sport.valueOf(sport.toUpperCase());
            String workflowId = "ranking-init-" + sport.toLowerCase() + "-" + System.currentTimeMillis();
            
            WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("player-registration")
                .setWorkflowId(workflowId)
                .build();
            
            PlayerRankingWorkflow workflow = workflowClient.newWorkflowStub(
                PlayerRankingWorkflow.class, options);
            
            // Start workflow asynchronously
            WorkflowClient.start(workflow::initializeTop50, sportEnum);
            
            log.info("Started ranking workflow: {}", workflowId);
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "sport", sport,
                "workflowId", workflowId,
                "message", "Top 50 initialization workflow started",
                "statusEndpoint", "/api/admin/players/rankings/status/" + workflowId,
                "note", "Workflow will take 2-3 minutes. Check status endpoint or logs for progress."
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Invalid sport. Valid values: FOOTBALL, BASKETBALL, CRICKET, TENNIS, MMA"
            ));
        } catch (Exception e) {
            log.error("Error starting ranking workflow: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/rankings/initialize-all")
    @Operation(summary = "Initialize top 50 for ALL sports via Temporal",
               description = "Triggers workflow to initialize all 5 sports automatically (250 players total)")
    public ResponseEntity<Map<String, Object>> initializeAllSports() {
        log.info("Admin request to initialize top 50 for ALL sports via Temporal");
        
        if (workflowClient == null) {
            return ResponseEntity.status(503).body(Map.of(
                "success", false,
                "error", "Temporal workflows are disabled",
                "hint", "Set temporal.enabled=true and ensure Temporal server is running"
            ));
        }
        
        try {
            String workflowId = "ranking-init-all-" + System.currentTimeMillis();
            
            WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("player-registration")
                .setWorkflowId(workflowId)
                .build();
            
            AllSportsRankingWorkflow workflow = workflowClient.newWorkflowStub(
                AllSportsRankingWorkflow.class, options);
            
            // Start workflow asynchronously
            WorkflowClient.start(workflow::initializeAllSports);
            
            log.info("Started all-sports ranking workflow: {}", workflowId);
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "workflowId", workflowId,
                "message", "Initializing top 50 for all 5 sports (250 players total)",
                "sports", new String[]{"FOOTBALL", "BASKETBALL", "CRICKET", "TENNIS", "MMA"},
                "statusEndpoint", "/api/admin/players/rankings/status/" + workflowId,
                "estimatedTime", "15-20 minutes",
                "note", "Workflow processes each sport sequentially. Monitor logs for real-time progress."
            ));
        } catch (Exception e) {
            log.error("Error starting all-sports ranking workflow: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/rankings/top50/{sport}")
    @Operation(summary = "Get current top 50 for a sport")
    public ResponseEntity<?> getTop50(@PathVariable String sport) {
        try {
            Sport sportEnum = Sport.valueOf(sport.toUpperCase());
            var top50 = rankingService.getTop50(sportEnum);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "sport", sport,
                "count", top50.size(),
                "players", top50.stream().map(p -> Map.of(
                    "rank", p.getCurrentRank(),
                    "name", p.getDisplayName() != null ? p.getDisplayName() : p.getName(),
                    "team", p.getTeam() != null ? p.getTeam() : "N/A",
                    "nationality", p.getNationality() != null ? p.getNationality() : "N/A",
                    "score", p.getRankingScore() != null ? p.getRankingScore() : 0.0
                )).toList()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Invalid sport"
            ));
        }
    }
    
    @GetMapping("/data-quality")
    @Operation(summary = "Get data quality statistics",
               description = "Check for corrupted normalizedName, invalid aliases, null fields, etc.")
    public ResponseEntity<Map<String, Object>> getDataQualityStats() {
        log.info("Admin request for data quality stats");
        
        Map<String, Object> stats = dataCleanupService.getDataQualityStats();
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/cleanup")
    @Operation(summary = "Run data cleanup",
               description = "Fix corrupted normalizedName, remove AI reasoning from aliases, set defaults")
    public ResponseEntity<Map<String, Object>> runDataCleanup() {
        log.info("Admin request to run data cleanup");
        
        try {
            dataCleanupService.cleanupAllPlayersAsync();
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "message", "Data cleanup started in background",
                "fixes", new String[]{
                    "Fixing corrupted normalizedName fields",
                    "Removing AI reasoning from aliases",
                    "Setting default values for null fields"
                },
                "note", "Check logs for progress. This may take a few seconds."
            ));
        } catch (Exception e) {
            log.error("Error starting data cleanup: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/enrich/all")
    @Operation(summary = "Enrich ALL players with missing data using AI",
               description = "Uses Temporal workflow to populate missing fields: height, weight, birthdate, birthplace, photo")
    public ResponseEntity<Map<String, Object>> enrichAllPlayers() {
        log.info("Admin request to enrich ALL players with AI");
        
        if (workflowClient == null) {
            return ResponseEntity.status(503).body(Map.of(
                "success", false,
                "error", "Temporal workflows are disabled",
                "hint", "Set temporal.enabled=true and ensure Temporal server is running"
            ));
        }
        
        try {
            String workflowId = "player-enrichment-all-" + System.currentTimeMillis();
            
            WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("player-registration")
                .setWorkflowId(workflowId)
                .build();
            
            PlayerEnrichmentWorkflow workflow = workflowClient.newWorkflowStub(
                PlayerEnrichmentWorkflow.class, options);
            
            // Start workflow asynchronously
            WorkflowClient.start(workflow::enrichAllPlayers);
            
            log.info("Started enrichment workflow: {}", workflowId);
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "workflowId", workflowId,
                "message", "Player data enrichment workflow started",
                "note", "This will populate missing height, weight, birthdate, birthplace, and photo for all players.",
                "estimatedTime", "2-5 minutes depending on number of players",
                "monitoring", "Check logs for progress"
            ));
        } catch (Exception e) {
            log.error("Error starting enrichment workflow: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/enrich/{sport}")
    @Operation(summary = "Enrich specific sport players with missing data using AI",
               description = "Uses Temporal workflow to populate missing fields for a specific sport")
    public ResponseEntity<Map<String, Object>> enrichSportPlayers(@PathVariable String sport) {
        log.info("Admin request to enrich {} players with AI", sport);
        
        if (workflowClient == null) {
            return ResponseEntity.status(503).body(Map.of(
                "success", false,
                "error", "Temporal workflows are disabled",
                "hint", "Set temporal.enabled=true and ensure Temporal server is running"
            ));
        }
        
        try {
            Sport.valueOf(sport.toUpperCase()); // Validate sport
            
            String workflowId = "player-enrichment-" + sport.toLowerCase() + "-" + System.currentTimeMillis();
            
            WorkflowOptions options = WorkflowOptions.newBuilder()
                .setTaskQueue("player-registration")
                .setWorkflowId(workflowId)
                .build();
            
            SportEnrichmentWorkflow workflow = workflowClient.newWorkflowStub(
                SportEnrichmentWorkflow.class, options);
            
            // Start workflow asynchronously
            WorkflowClient.start(() -> workflow.enrichSportPlayers(sport.toUpperCase()));
            
            log.info("Started enrichment workflow for {}: {}", sport, workflowId);
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "sport", sport,
                "workflowId", workflowId,
                "message", String.format("Player data enrichment workflow started for %s", sport),
                "note", "This will populate missing height, weight, birthdate, birthplace, and photo.",
                "estimatedTime", "1-3 minutes",
                "monitoring", "Check logs for progress"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Invalid sport. Valid values: FOOTBALL, BASKETBALL, CRICKET, TENNIS, MMA"
            ));
        } catch (Exception e) {
            log.error("Error starting enrichment workflow: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    // ==================== TOP 100 ALL-TIME GREATEST SEEDING ====================
    
    @PostMapping("/top100/seed/{sport}")
    @Operation(summary = "Seed Top 100 All-Time Greatest Players for a sport",
               description = "Uses AI (DeepSeek R1) to generate and store the Top 100 greatest players of all time for the specified sport. Takes 5-10 minutes.")
    public ResponseEntity<Map<String, Object>> seedTop100(@PathVariable String sport) {
        log.info("🚀 Admin request to seed Top 100 for: {}", sport);
        
        try {
            Sport sportEnum = Sport.valueOf(sport.toUpperCase());
            
            // Check if already seeded
            if (top100SeedingService.isSportSeeded(sportEnum)) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "sport", sport,
                    "message", "Sport already has Top 100 data seeded",
                    "hint", "Use /api/admin/players/top100/reseed/" + sport + " to reseed (will delete existing data)"
                ));
            }
            
            // Start async seeding
            CompletableFuture.runAsync(() -> {
                try {
                    int count = top100SeedingService.seedTop100ForSport(sportEnum);
                    log.info("✅ Completed Top 100 seeding for {}. Total: {} players", sport, count);
                } catch (Exception e) {
                    log.error("❌ Failed to seed Top 100 for {}: {}", sport, e.getMessage(), e);
                }
            });
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "sport", sport,
                "message", "Top 100 seeding started for " + sport.toUpperCase(),
                "description", "Generating Top 100 All-Time Greatest " + sport.toUpperCase() + " Players up to 2025",
                "estimatedTime", "5-10 minutes (processing in batches of 10)",
                "checkEndpoint", "/api/admin/players/top100/stats",
                "viewEndpoint", "/api/admin/players/top100/" + sport.toLowerCase()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Invalid sport. Valid values: FOOTBALL, BASKETBALL, MMA, CRICKET, TENNIS, BASEBALL, HOCKEY, GOLF, F1, BOXING"
            ));
        } catch (Exception e) {
            log.error("Error starting Top 100 seeding: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/top100/reseed/{sport}")
    @Operation(summary = "Reseed Top 100 for a sport (deletes existing data)",
               description = "Clears existing Top 100 data and regenerates using AI")
    public ResponseEntity<Map<String, Object>> reseedTop100(@PathVariable String sport) {
        log.info("🔄 Admin request to RESEED Top 100 for: {}", sport);
        
        try {
            Sport sportEnum = Sport.valueOf(sport.toUpperCase());
            
            // Clear existing data
            top100SeedingService.clearSportData(sportEnum);
            
            // Start async seeding
            CompletableFuture.runAsync(() -> {
                try {
                    int count = top100SeedingService.seedTop100ForSport(sportEnum);
                    log.info("✅ Completed Top 100 reseed for {}. Total: {} players", sport, count);
                } catch (Exception e) {
                    log.error("❌ Failed to reseed Top 100 for {}: {}", sport, e.getMessage(), e);
                }
            });
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "sport", sport,
                "message", "Top 100 RESEED started for " + sport.toUpperCase(),
                "warning", "Previous data was deleted",
                "estimatedTime", "5-10 minutes",
                "checkEndpoint", "/api/admin/players/top100/stats"
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Invalid sport"
            ));
        } catch (Exception e) {
            log.error("Error starting Top 100 reseed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/top100/stats")
    @Operation(summary = "Get Top 100 seeding statistics for all sports")
    public ResponseEntity<Map<String, Object>> getTop100Stats() {
        log.info("Admin request for Top 100 seeding stats");
        
        String statsText = top100SeedingService.getSeedingStats();
        
        // Build detailed stats
        java.util.Map<String, Object> sportStats = new java.util.LinkedHashMap<>();
        for (Sport sport : Sport.values()) {
            long total = playerRepository.countBySport(sport);
            long ranked = playerRepository.countBySportAndCurrentRankIsNotNull(sport);
            sportStats.put(sport.name(), Map.of(
                "total", total,
                "ranked", ranked,
                "complete", ranked >= 100
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "stats", sportStats,
            "summary", statsText
        ));
    }
    
    @GetMapping("/top100/{sport}")
    @Operation(summary = "Get Top 100 All-Time Greatest Players for a sport")
    public ResponseEntity<?> getTop100(@PathVariable String sport) {
        try {
            Sport sportEnum = Sport.valueOf(sport.toUpperCase());
            List<Player> top100 = playerRepository.findTop100BySport(sportEnum);
            
            if (top100.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "sport", sport,
                    "count", 0,
                    "message", "No Top 100 data found. Use POST /api/admin/players/top100/seed/" + sport + " to seed data."
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "sport", sport,
                "title", "Top 100 All-Time Greatest " + sport.toUpperCase() + " Players (up to 2025)",
                "count", top100.size(),
                "players", top100.stream().map(p -> Map.of(
                    "rank", p.getCurrentRank(),
                    "name", p.getName(),
                    "displayName", p.getDisplayName() != null ? p.getDisplayName() : p.getName(),
                    "team", p.getTeam() != null ? p.getTeam() : "N/A",
                    "position", p.getPosition() != null ? p.getPosition() : "N/A",
                    "nationality", p.getNationality() != null ? p.getNationality() : "N/A",
                    "isActive", p.getIsActive() != null && p.getIsActive(),
                    "score", p.getRankingScore() != null ? p.getRankingScore() : 0.0,
                    "photoUrl", p.getPhotoUrl() != null ? p.getPhotoUrl() : ""
                )).toList()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Invalid sport"
            ));
        }
    }
    
    @PostMapping("/top100/seed-football-basketball")
    @Operation(summary = "Quick Start: Seed Top 100 for Football AND Basketball",
               description = "Convenience endpoint to seed both major sports at once. Takes 10-20 minutes total.")
    public ResponseEntity<Map<String, Object>> seedFootballAndBasketball() {
        log.info("🚀🏀⚽ Admin request to seed Top 100 for FOOTBALL and BASKETBALL");
        
        try {
            // Start async seeding for both sports
            CompletableFuture.runAsync(() -> {
                try {
                    log.info("⚽ Starting Football Top 100 seeding...");
                    int footballCount = top100SeedingService.seedTop100ForSport(Sport.FOOTBALL);
                    log.info("✅ Football Top 100 complete! {} players", footballCount);
                    
                    // Small delay between sports
                    TimeUnit.SECONDS.sleep(10);
                    
                    log.info("🏀 Starting Basketball Top 100 seeding...");
                    int basketballCount = top100SeedingService.seedTop100ForSport(Sport.BASKETBALL);
                    log.info("✅ Basketball Top 100 complete! {} players", basketballCount);
                    
                    log.info("🎉 ALL DONE! Football: {}, Basketball: {}", footballCount, basketballCount);
                } catch (Exception e) {
                    log.error("❌ Error during seeding: {}", e.getMessage(), e);
                }
            });
            
            return ResponseEntity.accepted().body(Map.of(
                "success", true,
                "message", "Top 100 seeding started for FOOTBALL and BASKETBALL",
                "sports", new String[]{"FOOTBALL", "BASKETBALL"},
                "description", "Generating Top 100 All-Time Greatest Players for both sports (up to 2025)",
                "estimatedTime", "10-20 minutes total",
                "checkEndpoint", "/api/admin/players/top100/stats",
                "viewEndpoints", Map.of(
                    "football", "/api/admin/players/top100/football",
                    "basketball", "/api/admin/players/top100/basketball"
                )
            ));
            
        } catch (Exception e) {
            log.error("Error starting Football+Basketball seeding: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}
