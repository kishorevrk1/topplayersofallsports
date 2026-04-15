package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.entity.*;
import com.topplayersofallsports.playerservice.exception.EntityNotFoundException;
import com.topplayersofallsports.playerservice.repository.NominationRepository;
import com.topplayersofallsports.playerservice.repository.RatingDayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class NominationService {

    private static final int MIN_SUPPORT_VOTES = 5;

    private final NominationRepository nominationRepository;
    private final RatingDayRepository ratingDayRepository;

    /**
     * Submit a new nomination.
     */
    @Transactional
    public Nomination submitNomination(Sport sport, String playerName, String reason,
                                       String userId) {
        // Find active Rating Day for sport
        RatingDay rd = ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.ACTIVE)
                .orElseThrow(() -> new IllegalStateException(
                    "No active Rating Day for " + sport + " — nominations are only accepted during voting"));

        // Check if user already nominated for this sport this Rating Day
        if (nominationRepository.existsByRatingDayIdAndNominatedByUserIdAndSport(
                rd.getId(), userId, sport)) {
            throw new IllegalStateException(
                "You have already submitted a nomination for " + sport + " this Rating Day");
        }

        Nomination nomination = Nomination.builder()
                .ratingDayId(rd.getId())
                .sport(sport)
                .playerName(playerName)
                .reason(reason)
                .nominatedByUserId(userId)
                .build();

        nomination = nominationRepository.save(nomination);
        log.info("Nomination submitted: {} for {} by user {}", playerName, sport, userId);
        return nomination;
    }

    /**
     * Support (upvote) a nomination. Increments support_votes.
     */
    @Transactional
    public Nomination supportNomination(Long nominationId, String userId) {
        Nomination nom = nominationRepository.findById(nominationId)
                .orElseThrow(() -> new EntityNotFoundException("Nomination", nominationId));

        if (nom.getStatus() != Nomination.Status.PENDING) {
            throw new IllegalStateException("Nomination is no longer accepting support votes");
        }

        if (nom.getNominatedByUserId().equals(userId)) {
            throw new IllegalStateException("Cannot support your own nomination");
        }

        // Note: nomination_support table handles uniqueness via DB constraint
        nom.setSupportVotes(nom.getSupportVotes() + 1);
        nom = nominationRepository.save(nom);

        log.info("Nomination {} now has {} support votes", nominationId, nom.getSupportVotes());
        return nom;
    }

    /**
     * Get current nominations for an active Rating Day.
     */
    public List<Nomination> getCurrentNominations(Sport sport) {
        RatingDay rd = ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.ACTIVE)
                .or(() -> ratingDayRepository.findBySportAndStatus(sport, RatingDay.Status.CLOSED))
                .orElse(null);

        if (rd == null) return List.of();
        return nominationRepository.findByRatingDayIdAndSport(rd.getId(), sport);
    }

    /**
     * Get qualifying nominations (>=5 support votes) for evaluation.
     */
    public List<Nomination> getQualifyingNominations(Long ratingDayId) {
        return nominationRepository.findQualifyingNominations(ratingDayId, MIN_SUPPORT_VOTES);
    }
}
