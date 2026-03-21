package com.topplayersofallsports.playerservice.temporal.workflow;

import com.topplayersofallsports.playerservice.temporal.activity.RatingDayActivities;
import io.temporal.activity.ActivityOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;

public class NominationEvaluationWorkflowImpl implements NominationEvaluationWorkflow {

    private final RatingDayActivities activities = Workflow.newActivityStub(
            RatingDayActivities.class,
            ActivityOptions.newBuilder()
                    .setStartToCloseTimeout(Duration.ofMinutes(5))
                    .build());

    @Override
    public String evaluateNominations(Long ratingDayId) {
        activities.evaluateNominations(ratingDayId);
        return "Nominations evaluated for Rating Day " + ratingDayId;
    }
}
