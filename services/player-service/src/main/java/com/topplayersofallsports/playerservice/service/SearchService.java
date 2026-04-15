package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.PlayerSummary;
import com.topplayersofallsports.playerservice.dto.SearchResultsResponse;
import com.topplayersofallsports.playerservice.entity.Player;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final PlayerRepository playerRepository;

    public SearchResultsResponse search(String q, String sport, int page, int size) {
        String sportParam = (sport == null || sport.isBlank() || sport.equalsIgnoreCase("all"))
                ? null : sport.toUpperCase();

        Page<Player> results = playerRepository.searchPlayers(
                q.trim(), sportParam, PageRequest.of(page, size));

        var players = results.getContent().stream()
                .map(p -> PlayerSummary.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .sport(p.getSport() != null ? p.getSport().name() : null)
                        .team(p.getTeam())
                        .position(p.getPosition())
                        .nationality(p.getNationality())
                        .currentRank(p.getCurrentRank())
                        .aiRating(p.getRankingScore())
                        .photoUrl(p.getPhotoUrl())
                        .build())
                .toList();

        return SearchResultsResponse.builder()
                .players(players)
                .total((int) results.getTotalElements())
                .page(page)
                .pageSize(size)
                .query(q)
                .build();
    }
}
