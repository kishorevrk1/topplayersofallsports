package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.dto.MatchupResponse;
import com.topplayersofallsports.playerservice.dto.VoteRequest;
import com.topplayersofallsports.playerservice.dto.VoteResponse;
import com.topplayersofallsports.playerservice.entity.*;
import com.topplayersofallsports.playerservice.exception.EntityNotFoundException;
import com.topplayersofallsports.playerservice.repository.EloMatchupRepository;
import com.topplayersofallsports.playerservice.repository.PlayerRepository;
import com.topplayersofallsports.playerservice.repository.RatingDayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EloService {

    private static final int K_FACTOR = 32;
    private static final int MAX_MATCHUPS_PER_USER = 50;
    private static final int MAX_VOTES_PER_MINUTE = 10;
    private static final int PREFERRED_RANK_RANGE = 20;

    private final PlayerRepository playerRepository;
    private final EloMatchupRepository matchupRepository;
    private final RatingDayRepository ratingDayRepository;
    private final StringRedisTemplate redisTemplate;

    /**
     * Calculate ELO expected score.
     * expectedScore = 1 / (1 + 10^((opponentElo - playerElo) / 400))
     */
    public double expectedScore(double playerElo, double opponentElo) {
        return 1.0 / (1.0 + Math.pow(10, (opponentElo - playerElo) / 400.0));
    }

    /**
     * Calculate new ELO after a result.
     * newElo = oldElo + K * (actualScore - expectedScore)
     */
    public double newElo(double oldElo, double expectedScore, double actualScore) {
        return oldElo + K_FACTOR * (actualScore - expectedScore);
    }

    /**
     * Process a vote: validate, calculate ELO, persist, return result + next matchup.
     */
    @Transactional
    public VoteResponse processVote(Long ratingDayId, VoteRequest request, String userId) {
        RatingDay ratingDay = ratingDayRepository.findById(ratingDayId)
                .orElseThrow(() -> new EntityNotFoundException("RatingDay", ratingDayId));

        if (!ratingDay.isVotingOpen()) {
            throw new IllegalStateException("Voting is not open for this Rating Day");
        }

        // Rate limit check
        checkRateLimit(userId);

        // Max matchups check
        long userVoteCount = matchupRepository.countByRatingDayAndVoter(ratingDayId, userId);
        if (userVoteCount >= MAX_MATCHUPS_PER_USER) {
            throw new IllegalStateException(
                "Maximum " + MAX_MATCHUPS_PER_USER + " votes per Rating Day reached");
        }

        // Canonicalize player IDs
        Long p1Id = Math.min(request.getPlayer1Id(), request.getPlayer2Id());
        Long p2Id = Math.max(request.getPlayer1Id(), request.getPlayer2Id());

        // Validate winner is one of the two players
        if (!request.getWinnerId().equals(p1Id) && !request.getWinnerId().equals(p2Id)) {
            throw new IllegalArgumentException("winnerId must be one of the two players");
        }

        // Check duplicate vote
        if (matchupRepository.existsByRatingDayIdAndVoterUserIdAndPlayer1IdAndPlayer2Id(
                ratingDayId, userId, p1Id, p2Id)) {
            throw new IllegalStateException("You have already voted on this matchup");
        }

        Player player1 = playerRepository.findById(p1Id)
                .orElseThrow(() -> new EntityNotFoundException("Player", p1Id));
        Player player2 = playerRepository.findById(p2Id)
                .orElseThrow(() -> new EntityNotFoundException("Player", p2Id));

        double p1EloBefore = player1.getEloScore() != null ? player1.getEloScore() : 1500.0;
        double p2EloBefore = player2.getEloScore() != null ? player2.getEloScore() : 1500.0;

        // Calculate ELO changes
        double p1Expected = expectedScore(p1EloBefore, p2EloBefore);
        double p2Expected = expectedScore(p2EloBefore, p1EloBefore);

        double p1Actual = request.getWinnerId().equals(p1Id) ? 1.0 : 0.0;
        double p2Actual = 1.0 - p1Actual;

        double p1EloAfter = Math.round(newElo(p1EloBefore, p1Expected, p1Actual) * 100.0) / 100.0;
        double p2EloAfter = Math.round(newElo(p2EloBefore, p2Expected, p2Actual) * 100.0) / 100.0;

        // Update player ELO scores
        player1.setEloScore(p1EloAfter);
        player2.setEloScore(p2EloAfter);
        playerRepository.save(player1);
        playerRepository.save(player2);

        // Record the matchup
        EloMatchup matchup = EloMatchup.builder()
                .ratingDayId(ratingDayId)
                .player1Id(p1Id)
                .player2Id(p2Id)
                .voterUserId(userId)
                .winnerId(request.getWinnerId())
                .player1EloBefore(p1EloBefore)
                .player2EloBefore(p2EloBefore)
                .player1EloAfter(p1EloAfter)
                .player2EloAfter(p2EloAfter)
                .build();
        matchupRepository.save(matchup);

        // Increment vote counter in Redis
        String voteCountKey = "ratingday:" + ratingDayId + ":votes";
        redisTemplate.opsForValue().increment(voteCountKey);

        // Get next matchup
        MatchupResponse nextMatchup = getNextMatchup(ratingDayId, ratingDay.getSport(), userId);

        return VoteResponse.builder()
                .player1EloAfter(p1EloAfter)
                .player2EloAfter(p2EloAfter)
                .player1EloChange(p1EloAfter - p1EloBefore)
                .player2EloChange(p2EloAfter - p2EloBefore)
                .nextMatchup(nextMatchup)
                .build();
    }

    /**
     * Get the next head-to-head matchup for a user.
     * Prefers matchups between players within ~20 rank positions.
     * Returns null if no matchups remain.
     */
    public MatchupResponse getNextMatchup(Long ratingDayId, Sport sport, String userId) {
        List<Player> top100 = playerRepository.findTop100BySportOrderByEloDesc(sport);
        if (top100.size() < 2) return null;

        // Get pairs user already voted on
        List<EloMatchup> userVotes = matchupRepository.findByRatingDayAndVoter(ratingDayId, userId);
        Set<String> votedPairs = userVotes.stream()
                .map(m -> m.getPlayer1Id() + "-" + m.getPlayer2Id())
                .collect(Collectors.toSet());

        long totalUserVotes = userVotes.size();
        if (totalUserVotes >= MAX_MATCHUPS_PER_USER) return null;

        // Build candidate pairs, preferring close ranks
        List<long[]> closePairs = new ArrayList<>();
        List<long[]> farPairs = new ArrayList<>();

        for (int i = 0; i < top100.size(); i++) {
            for (int j = i + 1; j < top100.size(); j++) {
                Long id1 = Math.min(top100.get(i).getId(), top100.get(j).getId());
                Long id2 = Math.max(top100.get(i).getId(), top100.get(j).getId());
                String pairKey = id1 + "-" + id2;

                if (!votedPairs.contains(pairKey)) {
                    int rankDiff = Math.abs(i - j);
                    if (rankDiff <= PREFERRED_RANK_RANGE) {
                        closePairs.add(new long[]{id1, id2});
                    } else {
                        farPairs.add(new long[]{id1, id2});
                    }
                }
            }
        }

        // Pick from close pairs first, then far pairs
        List<long[]> pool = closePairs.isEmpty() ? farPairs : closePairs;
        if (pool.isEmpty()) return null;

        long[] chosen = pool.get(new Random().nextInt(pool.size()));

        Player p1 = playerRepository.findById(chosen[0]).orElse(null);
        Player p2 = playerRepository.findById(chosen[1]).orElse(null);
        if (p1 == null || p2 == null) return null;

        return buildMatchupResponse(p1, p2, (int) totalUserVotes + 1, MAX_MATCHUPS_PER_USER);
    }

    private MatchupResponse buildMatchupResponse(Player p1, Player p2, int matchNumber, int maxMatches) {
        return MatchupResponse.builder()
                .player1Id(p1.getId())
                .player1Name(p1.getName())
                .player1DisplayName(p1.getDisplayName())
                .player1PhotoUrl(p1.getPhotoUrl())
                .player1Position(p1.getPosition())
                .player1Nationality(p1.getNationality())
                .player1Rank(p1.getCurrentRank())
                .player1Elo(p1.getEloScore())
                .player1Team(p1.getTeam())
                .player2Id(p2.getId())
                .player2Name(p2.getName())
                .player2DisplayName(p2.getDisplayName())
                .player2PhotoUrl(p2.getPhotoUrl())
                .player2Position(p2.getPosition())
                .player2Nationality(p2.getNationality())
                .player2Rank(p2.getCurrentRank())
                .player2Elo(p2.getEloScore())
                .player2Team(p2.getTeam())
                .matchNumber(matchNumber)
                .maxMatches(maxMatches)
                .build();
    }

    private void checkRateLimit(String userId) {
        String key = "ratelimit:vote:" + userId;
        String count = redisTemplate.opsForValue().get(key);
        if (count != null && Integer.parseInt(count) >= MAX_VOTES_PER_MINUTE) {
            throw new IllegalStateException("Rate limit exceeded — max " + MAX_VOTES_PER_MINUTE + " votes per minute");
        }
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, Duration.ofSeconds(60));
    }
}
