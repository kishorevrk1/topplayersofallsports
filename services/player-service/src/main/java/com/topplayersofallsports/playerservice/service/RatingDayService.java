package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.RatingDayResultsResponse;
import com.topplayersofallsports.playerservice.entity.*;
import com.topplayersofallsports.playerservice.exception.EntityNotFoundException;
import com.topplayersofallsports.playerservice.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RatingDayService {

    private final RatingDayRepository ratingDayRepository;
    private final PlayerRepository playerRepository;
    private final EloMatchupRepository matchupRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final StringRedisTemplate redisTemplate;

    private static final Sport[] ACTIVE_SPORTS = {
        Sport.FOOTBALL, Sport.BASKETBALL, Sport.MMA, Sport.CRICKET, Sport.TENNIS
    };

    /**
     * Get Rating Day by ID.
     */
    public RatingDay getRatingDayById(Long id) {
        return ratingDayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", id));
    }

    /**
     * Get the current (or most recent) Rating Day for a sport.
     */
    public RatingDay getCurrentRatingDay(Sport sport) {
        return ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.ACTIVE)
                .orElseGet(() -> ratingDayRepository
                        .findBySportAndStatusOrderByCreatedAtDesc(sport, RatingDay.Status.FINALIZED)
                        .stream().findFirst().orElse(null));
    }

    /**
     * Open Rating Days for all 5 sports. Called by MonthlyRatingDayWorkflow.
     */
    @Transactional
    public List<RatingDay> openRatingDays() {
        String month = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime closesAt = now.plusHours(48);

        List<RatingDay> created = new ArrayList<>();
        for (Sport sport : ACTIVE_SPORTS) {
            if (ratingDayRepository.findBySportAndMonth(sport, month).isPresent()) {
                log.warn("Rating Day already exists for {} {}", sport, month);
                continue;
            }
            RatingDay rd = RatingDay.builder()
                    .sport(sport)
                    .month(month)
                    .status(RatingDay.Status.ACTIVE)
                    .opensAt(now)
                    .closesAt(closesAt)
                    .build();
            created.add(ratingDayRepository.save(rd));
            log.info("Opened Rating Day for {} ({})", sport, month);
        }
        return created;
    }

    /**
     * Close all active Rating Days. Called after 48h timer.
     */
    @Transactional
    public void closeActiveRatingDays() {
        List<RatingDay> active = ratingDayRepository.findByStatus(RatingDay.Status.ACTIVE);
        for (RatingDay rd : active) {
            long votes = matchupRepository.countByRatingDay(rd.getId());
            long voters = matchupRepository.countDistinctVotersByRatingDay(rd.getId());
            rd.setStatus(RatingDay.Status.CLOSED);
            rd.setTotalVotes((int) votes);
            rd.setTotalVoters((int) voters);
            ratingDayRepository.save(rd);
            log.info("Closed Rating Day {} for {} — {} votes from {} voters",
                    rd.getId(), rd.getSport(), votes, voters);
        }
    }

    /**
     * Finalize a Rating Day: recalculate ranks from ELO, write history, update players.
     */
    @Transactional
    public void finalizeRatingDay(Long ratingDayId) {
        RatingDay rd = ratingDayRepository.findById(ratingDayId)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", ratingDayId));

        if (rd.getTotalVotes() == 0) {
            rd.setStatus(RatingDay.Status.FINALIZED);
            ratingDayRepository.save(rd);
            log.info("Rating Day {} finalized with zero votes — no rank changes", ratingDayId);
            return;
        }

        List<Player> players = playerRepository.findTop100BySportOrderByEloDesc(rd.getSport());

        for (int i = 0; i < players.size(); i++) {
            Player p = players.get(i);
            int newRank = i + 1;
            Integer oldRank = p.getCurrentRank();
            Double oldElo = p.getRankingScore() != null ? p.getRankingScore() : p.getEloScore();

            // Write history
            rankingHistoryRepository.save(RankingHistory.builder()
                    .playerId(p.getId())
                    .sport(rd.getSport())
                    .month(rd.getMonth())
                    .rankBefore(oldRank)
                    .rankAfter(newRank)
                    .eloBefore(oldElo)
                    .eloAfter(p.getEloScore())
                    .changeReason(RankingHistory.ChangeReason.VOTE)
                    .build());

            // Update player
            p.setPreviousRank(oldRank);
            p.setCurrentRank(newRank);
            p.setRankingScore(p.getEloScore());
            p.setLastRankingUpdate(LocalDateTime.now());
            playerRepository.save(p);
        }

        rd.setStatus(RatingDay.Status.FINALIZED);
        ratingDayRepository.save(rd);

        // Invalidate Redis cache
        redisTemplate.delete("ratingday:current:" + rd.getSport());
        redisTemplate.delete("ratingday:" + ratingDayId + ":votes");

        log.info("Finalized Rating Day {} for {} — {} players re-ranked",
                ratingDayId, rd.getSport(), players.size());
    }

    /**
     * Build results response for a finalized Rating Day.
     */
    public RatingDayResultsResponse getResults(Long ratingDayId) {
        RatingDay rd = ratingDayRepository.findById(ratingDayId)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", ratingDayId));

        List<RankingHistory> history = rankingHistoryRepository
                .findBySportAndMonthOrderByRankAfterAsc(rd.getSport(), rd.getMonth());

        List<RatingDayResultsResponse.RankMover> risers = new ArrayList<>();
        List<RatingDayResultsResponse.RankMover> fallers = new ArrayList<>();

        for (RankingHistory h : history) {
            if (h.getRankBefore() == null || h.getRankAfter() == null) continue;
            int change = h.getRankBefore() - h.getRankAfter(); // positive = rose
            Player p = playerRepository.findById(h.getPlayerId()).orElse(null);
            if (p == null) continue;

            RatingDayResultsResponse.RankMover mover = RatingDayResultsResponse.RankMover.builder()
                    .playerId(h.getPlayerId())
                    .playerName(p.getDisplayName() != null ? p.getDisplayName() : p.getName())
                    .rankBefore(h.getRankBefore())
                    .rankAfter(h.getRankAfter())
                    .rankChange(change)
                    .eloBefore(h.getEloBefore())
                    .eloAfter(h.getEloAfter())
                    .build();

            if (change > 0) risers.add(mover);
            else if (change < 0) fallers.add(mover);
        }

        risers.sort(Comparator.comparingInt(RatingDayResultsResponse.RankMover::getRankChange).reversed());
        fallers.sort(Comparator.comparingInt(RatingDayResultsResponse.RankMover::getRankChange));

        return RatingDayResultsResponse.builder()
                .ratingDayId(ratingDayId)
                .sport(rd.getSport().name())
                .month(rd.getMonth())
                .totalVotes(rd.getTotalVotes())
                .totalVoters(rd.getTotalVoters())
                .biggestRisers(risers.stream().limit(5).toList())
                .biggestFallers(fallers.stream().limit(5).toList())
                .newEntrants(List.of()) // populated by NominationService during finalization
                .build();
    }

    /**
     * Get past Rating Day summaries for a sport.
     */
    public List<RatingDay> getHistory(Sport sport) {
        return ratingDayRepository.findBySportAndStatusOrderByCreatedAtDesc(
                sport, RatingDay.Status.FINALIZED);
    }
}
