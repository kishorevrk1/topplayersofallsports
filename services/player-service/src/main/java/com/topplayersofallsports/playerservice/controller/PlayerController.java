package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.ComparisonResponse;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationRequest;
import com.topplayersofallsports.playerservice.dto.PlayerRegistrationResponse;
import com.topplayersofallsports.playerservice.entity.AIAnalysis;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.AIAnalysisRepository;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.service.PlayerRegistrationService;
import com.topplayersofallsports.playerservice.service.PlayerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Players", description = "Player data and AI analysis endpoints")
public class PlayerController {
    
    private final PlayerService playerService;
    private final PlayerRegistrationService playerRegistrationService;
    private final PlayerRepository playerRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    
    @GetMapping
    @Operation(summary = "Get all players by sport")
    public ResponseEntity<List<Player>> getPlayersBySport(
            @RequestParam(defaultValue = "FOOTBALL") String sport) {
        log.info("REST request to get players by sport: {}", sport);
        Sport sportEnum = Sport.valueOf(sport.toUpperCase());
        List<Player> players = playerService.getPlayersBySport(sportEnum);
        return ResponseEntity.ok(players);
    }
    
    @GetMapping("/top")
    @Operation(summary = "Get top-rated players by sport")
    public ResponseEntity<List<AIAnalysis>> getTopRatedPlayers(
            @RequestParam(defaultValue = "FOOTBALL") String sport) {
        log.info("REST request to get top-rated players for: {}", sport);
        Sport sportEnum = Sport.valueOf(sport.toUpperCase());
        List<AIAnalysis> topPlayers = playerService.getTopRatedPlayersBySport(sportEnum);
        return ResponseEntity.ok(topPlayers);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get player by ID with full details")
    public ResponseEntity<?> getPlayerById(@PathVariable Long id) {
        log.info("REST request to get player: {}", id);
        
        Optional<Player> playerOpt = playerRepository.findById(id);
        if (playerOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Player player = playerOpt.get();
        Optional<AIAnalysis> analysisOpt = aiAnalysisRepository.findByPlayer(player);
        
        // Build comprehensive response
        Map<String, Object> response = new HashMap<>();
        response.put("id", player.getId());
        response.put("name", player.getName());
        response.put("displayName", player.getDisplayName() != null ? player.getDisplayName() : player.getName());
        response.put("sport", player.getSport().name());
        response.put("team", player.getTeam());
        response.put("position", player.getPosition());
        response.put("nationality", player.getNationality());
        response.put("age", player.getAge());
        response.put("height", player.getHeight());
        response.put("weight", player.getWeight());
        response.put("photoUrl", player.getPhotoUrl());
        response.put("birthdate", player.getBirthdate());
        response.put("birthplace", player.getBirthplace());
        response.put("currentRank", player.getCurrentRank());
        response.put("isActive", player.getIsActive());
        response.put("rankingScore", player.getRankingScore());
        response.put("eloScore", player.getEloScore());

        if (analysisOpt.isPresent()) {
            AIAnalysis analysis = analysisOpt.get();
            response.put("aiRating", analysis.getAiRating());
            response.put("biography", analysis.getBiography());
            response.put("analysisText", analysis.getAnalysisText());
            response.put("strengths", analysis.getStrengths());
            response.put("careerHighlights", analysis.getCareerHighlights());
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}/analysis")
    @Operation(summary = "Get AI analysis for a player")
    public ResponseEntity<AIAnalysis> getAIAnalysis(@PathVariable Long id) {
        log.info("REST request to get AI analysis for player: {}", id);
        return playerService.getAIAnalysis(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    @Operation(summary = "Search players by name")
    public ResponseEntity<List<Player>> searchPlayers(@RequestParam String name) {
        log.info("REST request to search players: {}", name);
        List<Player> players = playerService.searchPlayers(name);
        return ResponseEntity.ok(players);
    }
    
    @PostMapping("/register")
    @Operation(summary = "Register a new player (User-driven with AI)",
               description = "Users can request to add a player. AI will search, validate, fetch from API-Sports, and enrich with full profile.")
    public ResponseEntity<PlayerRegistrationResponse> registerPlayer(
            @Valid @RequestBody PlayerRegistrationRequest request) {
        log.info("User registration request: {}", request.getPlayerName());
        PlayerRegistrationResponse response = playerRegistrationService.registerPlayer(request);
        return ResponseEntity.ok(response);
    }
    
    // ==================== TOP 100 ALL-TIME GREATEST PUBLIC ENDPOINTS ====================
    
    @GetMapping("/top100/{sport}")
    @Operation(summary = "Get Top 100 All-Time Greatest Players for a sport",
               description = "Returns the Top 100 greatest players of all time for the specified sport with full details")
    public ResponseEntity<?> getTop100(@PathVariable String sport) {
        log.info("REST request to get Top 100 for: {}", sport);
        
        try {
            Sport sportEnum = Sport.valueOf(sport.toUpperCase());
            List<Player> top100 = playerRepository.findTop100BySport(sportEnum);
            
            if (top100.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "sport", sport,
                    "title", "Top 100 All-Time Greatest " + formatSportName(sportEnum) + " Players",
                    "count", 0,
                    "players", List.of(),
                    "message", "No data available yet for this sport"
                ));
            }
            
            // Build response with full player details
            List<Map<String, Object>> playersList = top100.stream().map(player -> {
                Map<String, Object> p = new HashMap<>();
                p.put("id", player.getId());
                p.put("rank", player.getCurrentRank());
                p.put("name", player.getName());
                p.put("displayName", player.getDisplayName() != null ? player.getDisplayName() : player.getName());
                p.put("team", player.getTeam() != null ? player.getTeam() : "N/A");
                p.put("position", player.getPosition() != null ? player.getPosition() : "N/A");
                p.put("nationality", player.getNationality() != null ? player.getNationality() : "N/A");
                p.put("age", player.getAge());
                p.put("height", player.getHeight());
                p.put("weight", player.getWeight());
                p.put("photoUrl", player.getPhotoUrl());
                p.put("isActive", player.getIsActive() != null && player.getIsActive());
                p.put("eloScore", player.getEloScore() != null ? Math.round(player.getEloScore()) : 1500);
                p.put("rating", player.getRankingScore() != null ? player.getRankingScore().intValue() : 0);
                
                // Add AI analysis if available
                aiAnalysisRepository.findByPlayer(player).ifPresent(analysis -> {
                    p.put("aiRating", analysis.getAiRating());
                    p.put("biography", analysis.getBiography());
                    p.put("strengths", analysis.getStrengths());
                    p.put("careerHighlights", analysis.getCareerHighlights());
                });

                return p;
            }).toList();
            
            return ResponseEntity.ok(Map.of(
                "sport", sport.toUpperCase(),
                "title", "Top 100 All-Time Greatest " + formatSportName(sportEnum) + " Players",
                "subtitle", "Historical rankings up to 2025",
                "count", top100.size(),
                "players", playersList
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid sport",
                "validSports", List.of("FOOTBALL", "BASKETBALL", "MMA", "CRICKET", "TENNIS", "BASEBALL", "HOCKEY", "GOLF", "F1", "BOXING")
            ));
        }
    }
    
    @GetMapping("/top100")
    @Operation(summary = "Get available Top 100 lists",
               description = "Returns information about which sports have Top 100 data available")
    public ResponseEntity<?> getTop100Sports() {
        log.info("REST request to get available Top 100 sports");
        
        Map<String, Object> sportsInfo = new HashMap<>();
        for (Sport sport : List.of(Sport.FOOTBALL, Sport.BASKETBALL, Sport.MMA, Sport.CRICKET, Sport.TENNIS)) {
            long count = playerRepository.countBySportAndCurrentRankIsNotNull(sport);
            sportsInfo.put(sport.name().toLowerCase(), Map.of(
                "name", formatSportName(sport),
                "count", count,
                "available", count > 0,
                "endpoint", "/api/players/top100/" + sport.name().toLowerCase()
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "title", "Top 100 All-Time Greatest Players",
            "description", "Historical rankings of the greatest players up to 2025",
            "sports", sportsInfo
        ));
    }
    
    /**
     * GET /api/players/compare?p1=1&p2=2
     * Returns both players with their ACR rating snapshots for side-by-side comparison.
     */
    @GetMapping("/compare")
    @Operation(summary = "Compare two players side by side",
               description = "Returns both players with their ACR rating breakdowns for direct comparison")
    public ResponseEntity<?> comparePlayers(
            @RequestParam Long p1,
            @RequestParam Long p2) {
        log.info("REST request to compare players {} and {}", p1, p2);

        Optional<Player> p1Opt = playerRepository.findById(p1);
        Optional<Player> p2Opt = playerRepository.findById(p2);

        if (p1Opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Player not found: " + p1));
        }
        if (p2Opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Player not found: " + p2));
        }

        return ResponseEntity.ok(ComparisonResponse.builder()
            .player1(toSnapshot(p1Opt.get()))
            .player2(toSnapshot(p2Opt.get()))
            .build());
    }

    private ComparisonResponse.PlayerSnapshot toSnapshot(Player player) {
        Optional<AIAnalysis> analysis = aiAnalysisRepository.findByPlayer(player);
        return ComparisonResponse.PlayerSnapshot.builder()
            .id(player.getId())
            .name(player.getName())
            .displayName(player.getDisplayName() != null ? player.getDisplayName() : player.getName())
            .sport(player.getSport().name())
            .team(player.getTeam())
            .position(player.getPosition())
            .nationality(player.getNationality())
            .age(player.getAge())
            .photoUrl(player.getPhotoUrl())
            .isActive(player.getIsActive())
            .score(analysis.map(a -> a.getAiRating() != null ? a.getAiRating().doubleValue() : null).orElse(player.getRankingScore()))
            .build();
    }

    private String formatSportName(Sport sport) {
        return switch (sport) {
            case FOOTBALL -> "Football/Soccer";
            case BASKETBALL -> "Basketball";
            case MMA -> "MMA/UFC";
            case CRICKET -> "Cricket";
            case TENNIS -> "Tennis";
            case BASEBALL -> "Baseball";
            case HOCKEY -> "Hockey";
            case GOLF -> "Golf";
            case F1 -> "Formula 1";
            case BOXING -> "Boxing";
            case SWIMMING -> "Swimming";
            case ATHLETICS -> "Athletics";
        };
    }
}

