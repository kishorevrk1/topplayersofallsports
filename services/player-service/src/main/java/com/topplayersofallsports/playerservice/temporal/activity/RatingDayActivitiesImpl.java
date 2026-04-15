package com.topplayersofallsports.playerservice.temporal.activity;

import com.topplayersofallsports.playerservice.entity.RatingDay;
import com.topplayersofallsports.playerservice.service.RatingDayService;
import com.topplayersofallsports.playerservice.service.NominationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class RatingDayActivitiesImpl implements RatingDayActivities {

    private final RatingDayService ratingDayService;
    private final NominationService nominationService;

    @Override
    public List<Long> openAllRatingDays() {
        List<RatingDay> created = ratingDayService.openRatingDays();
        return created.stream().map(RatingDay::getId).toList();
    }

    @Override
    public void closeAllRatingDays() {
        ratingDayService.closeActiveRatingDays();
    }

    @Override
    public void finalizeRatingDay(Long ratingDayId) {
        ratingDayService.finalizeRatingDay(ratingDayId);
    }

    @Override
    public void evaluateNominations(Long ratingDayId) {
        // AI nomination evaluation — Phase 2 (placeholder for now)
        log.info("Nomination evaluation for Rating Day {} — not yet implemented", ratingDayId);
    }
}
