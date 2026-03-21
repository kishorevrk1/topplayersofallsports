package com.topplayersofallsports.playerservice.temporal.workflow;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

@WorkflowInterface
public interface MonthlyRatingDayWorkflow {

    @WorkflowMethod
    String runMonthlyRatingDay();
}
