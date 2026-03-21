package com.topplayersofallsports.playerservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.topplayersofallsports.playerservice.config.SecurityConfig;
import com.topplayersofallsports.playerservice.dto.MatchupResponse;
import com.topplayersofallsports.playerservice.dto.VoteRequest;
import com.topplayersofallsports.playerservice.dto.VoteResponse;
import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.entity.Sport;
import com.topplayersofallsports.playerservice.repository.EloMatchupRepository;
import com.topplayersofallsports.playerservice.repository.UserRepository;
import com.topplayersofallsports.playerservice.service.EloService;
import com.topplayersofallsports.playerservice.service.JwtService;
import com.topplayersofallsports.playerservice.service.RatingDayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RatingDayController.class)
@Import(SecurityConfig.class)
class RatingDayControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;

    @MockBean EloService eloService;
    @MockBean RatingDayService ratingDayService;
    @MockBean EloMatchupRepository matchupRepository;
    @MockBean JwtService jwtService;
    @MockBean UserRepository userRepository;

    @Test
    void getCurrentRatingDay_public_returns200() throws Exception {
        RatingDay rd = RatingDay.builder()
                .id(1L).sport(Sport.FOOTBALL).month("2026-03")
                .status(RatingDay.Status.ACTIVE)
                .opensAt(LocalDateTime.now()).closesAt(LocalDateTime.now().plusHours(48))
                .build();
        when(ratingDayService.getCurrentRatingDay(Sport.FOOTBALL)).thenReturn(rd);

        mockMvc.perform(get("/api/rating-day/current/FOOTBALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sport").value("FOOTBALL"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getCurrentRatingDay_noActive_returns204() throws Exception {
        when(ratingDayService.getCurrentRatingDay(Sport.FOOTBALL)).thenReturn(null);

        mockMvc.perform(get("/api/rating-day/current/FOOTBALL"))
                .andExpect(status().isNoContent());
    }

    @Test
    void vote_withoutAuth_returns401() throws Exception {
        VoteRequest req = new VoteRequest();
        req.setPlayer1Id(1L);
        req.setPlayer2Id(2L);
        req.setWinnerId(1L);

        mockMvc.perform(post("/api/rating-day/1/vote")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void vote_withAuth_returns200() throws Exception {
        VoteRequest req = new VoteRequest();
        req.setPlayer1Id(1L);
        req.setPlayer2Id(2L);
        req.setWinnerId(1L);

        VoteResponse resp = VoteResponse.builder()
                .player1EloAfter(1516.0).player2EloAfter(1484.0)
                .player1EloChange(16.0).player2EloChange(-16.0)
                .build();

        when(jwtService.isValid("valid-token")).thenReturn(true);
        when(jwtService.getUserId("valid-token")).thenReturn("user-1");
        when(jwtService.getRole("valid-token")).thenReturn("USER");
        when(eloService.processVote(eq(1L), any(), eq("user-1"))).thenReturn(resp);

        mockMvc.perform(post("/api/rating-day/1/vote")
                        .with(csrf())
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.player1EloAfter").value(1516.0));
    }
}
