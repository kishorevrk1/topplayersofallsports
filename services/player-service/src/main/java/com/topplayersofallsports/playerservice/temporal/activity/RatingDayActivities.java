package com.topplayersofallsports.playerservice.temporal.activity;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;
import java.util.List;

@ActivityInterface
public interface RatingDayActivities {

    @ActivityMethod
    List<Long> openAllRatingDays();

    @ActivityMethod
    void closeAllRatingDays();

    @ActivityMethod
    void finalizeRatingDay(Long ratingDayId);

    @ActivityMethod
    void evaluateNominations(Long ratingDayId);
}
