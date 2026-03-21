package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.NominationRequest;
import com.topplayersofallsports.playerservice.entity.Nomination;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.service.NominationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nominations")
@RequiredArgsConstructor
@Slf4j
public class NominationController {

    private final NominationService nominationService;

    @PostMapping
    public ResponseEntity<Nomination> submitNomination(
            @Valid @RequestBody NominationRequest request,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        Sport sport = Sport.valueOf(request.getSport().toUpperCase());
        Nomination nomination = nominationService.submitNomination(
                sport, request.getPlayerName(), request.getReason(), userId);
        return ResponseEntity.status(201).body(nomination);
    }

    @PostMapping("/{id}/support")
    public ResponseEntity<Nomination> supportNomination(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        Nomination nomination = nominationService.supportNomination(id, userId);
        return ResponseEntity.ok(nomination);
    }

    @GetMapping("/{sport}/current")
    public ResponseEntity<List<Nomination>> getCurrentNominations(@PathVariable String sport) {
        Sport s = Sport.valueOf(sport.toUpperCase());
        return ResponseEntity.ok(nominationService.getCurrentNominations(s));
    }
}
