package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.RatingDayActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;
import java.util.List;

public class MonthlyRatingDayWorkflowImpl implements MonthlyRatingDayWorkflow {

    private final RatingDayActivities activities = Workflow.newActivityStub(
            RatingDayActivities.class,
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(5))
                    .build());

    @Override
    public String runMonthlyRatingDay() {
        // Phase 1: Open voting for all sports
        List<Long> ratingDayIds = activities.openAllRatingDays();
        Workflow.getLogger(MonthlyRatingDayWorkflowImpl.class)
                .info("Opened {} Rating Days", ratingDayIds.size());

        // Phase 2: Wait 48 hours (replay-safe timer)
        Workflow.sleep(Duration.ofHours(48));

        // Phase 3: Close voting
        activities.closeAllRatingDays();

        // Phase 4: Evaluate nominations + finalize each Rating Day
        for (Long rdId : ratingDayIds) {
            activities.evaluateNominations(rdId);
            activities.finalizeRatingDay(rdId);
        }

        return "Monthly Rating Day completed for " + ratingDayIds.size() + " sports";
    }
}
