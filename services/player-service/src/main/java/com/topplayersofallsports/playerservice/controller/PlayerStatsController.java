package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.PlayerStatsResponse;
import com.topplayersofallsports.playerservice.service.PlayerStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerStatsController {

    private final PlayerStatsService playerStatsService;

    @GetMapping("/{id}/stats")
    public ResponseEntity<PlayerStatsResponse> getStats(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(playerStatsService.getStats(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
