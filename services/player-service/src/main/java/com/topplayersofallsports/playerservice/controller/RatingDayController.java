package com.topplayersofallsports.playerservice.controller;

import com.topplayersofallsports.playerservice.dto.*;
import com.topplayersofallsports.playerservice.entity.EloMatchup;
import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.EloMatchupRepository;
import com.topplayersofallsports.playerservice.service.EloService;
import com.topplayersofallsports.playerservice.service.RatingDayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rating-day")
@RequiredArgsConstructor
@Slf4j
public class RatingDayController {

    private final EloService eloService;
    private final RatingDayService ratingDayService;
    private final EloMatchupRepository matchupRepository;

    // --- Public endpoints ---

    @GetMapping("/current/{sport}")
    public ResponseEntity<RatingDay> getCurrentRatingDay(@PathVariable String sport) {
        Sport s = Sport.valueOf(sport.toUpperCase());
        RatingDay rd = ratingDayService.getCurrentRatingDay(s);
        if (rd == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(rd);
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<RatingDayResultsResponse> getResults(@PathVariable Long id) {
        return ResponseEntity.ok(ratingDayService.getResults(id));
    }

    @GetMapping("/{sport}/history")
    public ResponseEntity<List<RatingDay>> getHistory(@PathVariable String sport) {
        Sport s = Sport.valueOf(sport.toUpperCase());
        return ResponseEntity.ok(ratingDayService.getHistory(s));
    }

    // --- Authenticated endpoints ---

    @GetMapping("/{id}/matchup")
    public ResponseEntity<MatchupResponse> getNextMatchup(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        RatingDay rd = ratingDayService.getRatingDayById(id);
        MatchupResponse matchup = eloService.getNextMatchup(id, rd.getSport(), userId);
        if (matchup == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(matchup);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<VoteResponse> submitVote(
            @PathVariable Long id,
            @Valid @RequestBody VoteRequest request,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        VoteResponse response = eloService.processVote(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/skip")
    public ResponseEntity<MatchupResponse> skipMatchup(
            @PathVariable Long id,
            @RequestBody VoteRequest skipRequest,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        RatingDay rd = ratingDayService.getRatingDayById(id);
        MatchupResponse next = eloService.getNextMatchup(id, rd.getSport(), userId);
        if (next == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(next);
    }

    @GetMapping("/{id}/my-votes")
    public ResponseEntity<List<EloMatchup>> getMyVotes(
            @PathVariable Long id,
            @AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).build();

        List<EloMatchup> votes = matchupRepository.findByRatingDayAndVoter(id, userId);
        return ResponseEntity.ok(votes);
    }
}
