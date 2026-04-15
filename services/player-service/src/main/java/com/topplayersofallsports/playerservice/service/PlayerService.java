package com.topplayersofallsports.playerservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.topplayersofallsports.playerservice.dto.ai.PlayerAnalysisResult;
import com.topplayersofallsports.playerservice.entity.AIAnalysis;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.entity.PlayerStats;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.AIAnalysisRepository;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.repository.PlayerStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerService {
    
    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final AIAnalysisService aiAnalysisService;
    
    /**
     * Get all players by sport with AI analysis
     */
    @Cacheable(value = "players", key = "#sport.name()")
    public List<Player> getPlayersBySport(Sport sport) {
        log.info("Fetching all players for sport: {}", sport);
        return playerRepository.findBySportOrderByIdDesc(sport);
    }
    
    /**
     * Get top rated players by sport
     */
    @Cacheable(value = "topPlayers", key = "#sport.name()")
    public List<AIAnalysis> getTopRatedPlayersBySport(Sport sport) {
        log.info("Fetching top-rated players for sport: {}", sport);
        return aiAnalysisRepository.findTopPlayersBySport(sport);
    }
    
    /**
     * Get player by ID with full details
     */
    @Cacheable(value = "player", key = "#playerId")
    public Optional<Player> getPlayerById(Long playerId) {
        return playerRepository.findById(playerId);
    }
    
    /**
     * Get AI analysis for a player
     */
    @Cacheable(value = "aiAnalysis", key = "#playerId")
    public Optional<AIAnalysis> getAIAnalysis(Long playerId) {
        return playerRepository.findById(playerId)
            .flatMap(aiAnalysisRepository::findByPlayer);
    }
    
    /**
     * Search players by name
     */
    public List<Player> searchPlayers(String name) {
        log.info("Searching for players with name: {}", name);
        return playerRepository.searchByName(name);
    }
    
    /**
     * Sync football players from API-Sports
     */
    @Transactional
    public int syncFootballPlayers(int season, int playersPerLeague) {
        log.info("API-Sports sync disabled - using AI-only approach for player registration");
        return 0; // No longer syncing from API-Sports
    }
    
    /**
     * Sync individual football player
     */
    @Transactional
    public void syncFootballPlayer(JsonNode playerData, int season) {
        try {
            JsonNode playerNode = playerData.has("player") ? playerData.get("player") : playerData;
            JsonNode statsNode = playerData.has("statistics") ? playerData.get("statistics").get(0) : null;
            
            String apiPlayerId = "FOOTBALL_" + playerNode.get("id").asText();
            String name = playerNode.get("name").asText();
            
            // Find or create player
            Player player = playerRepository.findByApiPlayerId(apiPlayerId)
                .orElse(Player.builder()
                    .apiPlayerId(apiPlayerId)
                    .sport(Sport.FOOTBALL)
                    .build());
            
            // Update player info
            player.setName(name);
            if (playerNode.has("age")) player.setAge(playerNode.get("age").asInt());
            if (playerNode.has("height")) player.setHeight(playerNode.get("height").asText());
            if (playerNode.has("weight")) player.setWeight(playerNode.get("weight").asText());
            if (playerNode.has("photo")) player.setPhotoUrl(playerNode.get("photo").asText());
            if (playerNode.has("nationality")) player.setNationality(playerNode.get("nationality").asText());
            
            if (playerNode.has("birth")) {
                JsonNode birthNode = playerNode.get("birth");
                if (birthNode.has("date") && !birthNode.get("date").isNull()) {
                    player.setBirthdate(LocalDate.parse(birthNode.get("date").asText()));
                }
                if (birthNode.has("place") && !birthNode.get("place").isNull()) {
                    player.setBirthplace(birthNode.get("place").asText());
                }
            }
            
            // Set team and position from statistics
            if (statsNode != null) {
                if (statsNode.has("team") && statsNode.get("team").has("name")) {
                    player.setTeam(statsNode.get("team").get("name").asText());
                }
                if (statsNode.has("games") && statsNode.get("games").has("position")) {
                    player.setPosition(statsNode.get("games").get("position").asText());
                }
            }
            
            player = playerRepository.save(player);
            log.info("Saved player: {}", name);
            
            // Save stats
            if (statsNode != null) {
                saveFootballStats(player, statsNode, String.valueOf(season));
            }
            
            // Generate AI analysis
            generateAIAnalysis(player);
            
        } catch (Exception e) {
            log.error("Error syncing football player: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Save football player statistics
     */
    private void saveFootballStats(Player player, JsonNode statsNode, String season) {
        try {
            PlayerStats stats = playerStatsRepository.findByPlayerAndSeason(player, season)
                .orElse(PlayerStats.builder()
                    .player(player)
                    .season(season)
                    .build());
            
            // Extract goals, assists, etc.
            if (statsNode.has("goals") && statsNode.get("goals").has("total")) {
                int goals = statsNode.get("goals").get("total").asInt(0);
                stats.setPpg(BigDecimal.valueOf(goals)); // Using PPG for goals
            }
            
            if (statsNode.has("goals") && statsNode.get("goals").has("assists")) {
                int assists = statsNode.get("goals").get("assists").asInt(0);
                stats.setApg(BigDecimal.valueOf(assists));
            }
            
            if (statsNode.has("games") && statsNode.get("games").has("appearences")) {
                int appearances = statsNode.get("games").get("appearences").asInt(0);
                stats.setRpg(BigDecimal.valueOf(appearances)); // Using RPG for appearances
            }
            
            playerStatsRepository.save(stats);
            log.debug("Saved stats for player: {}", player.getName());
            
        } catch (Exception e) {
            log.error("Error saving stats for player {}: {}", player.getName(), e.getMessage());
        }
    }
    
    /**
     * Generate AI analysis for a player
     */
    @Transactional
    public void generateAIAnalysis(Player player) {
        try {
            // Check if analysis already exists
            Optional<AIAnalysis> existingAnalysis = aiAnalysisRepository.findByPlayer(player);
            
            // Get player stats
            List<PlayerStats> stats = playerStatsRepository.findByPlayerOrderBySeasonDesc(player);
            
            // Generate AI analysis using DeepSeek R1
            PlayerAnalysisResult analysisResult = aiAnalysisService.analyzePlayer(player, stats);
            
            AIAnalysis aiAnalysis = existingAnalysis.orElse(AIAnalysis.builder()
                .player(player)
                .build());
            
            aiAnalysis.setAiRating(analysisResult.getRating());
            aiAnalysis.setAnalysisText(analysisResult.getAnalysis());
            aiAnalysis.setStrengths(analysisResult.getStrengths());
            aiAnalysis.setBiography(analysisResult.getBiography());
            aiAnalysis.setCareerHighlights(analysisResult.getCareerHighlights());
            aiAnalysis.setGeneratedAt(LocalDateTime.now());
            aiAnalysis.setLlmModel("deepseek/deepseek-r1:free");
            
            aiAnalysisRepository.save(aiAnalysis);
            log.info("Generated AI analysis for player: {} (Rating: {})", 
                player.getName(), analysisResult.getRating());
            
        } catch (Exception e) {
            log.error("Error generating AI analysis for player {}: {}", player.getName(), e.getMessage(), e);
        }
    }
    
    /**
     * Get sync stats
     */
    public String getSyncStats() {
        StringBuilder stats = new StringBuilder();
        stats.append("Player Sync Statistics:\n");
        
        for (Sport sport : Sport.values()) {
            long count = playerRepository.countBySport(sport);
            stats.append(String.format("%s: %d players\n", sport, count));
        }
        
        stats.append(String.format("Total: %d players\n", playerRepository.count()));
        stats.append(String.format("AI Analyses: %d\n", aiAnalysisRepository.count()));
        
        return stats.toString();
    }
}
