package com.topplayersofallsports.news.temporal;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal workflow for periodic news ingestion
 */
@WorkflowInterface
public interface NewsIngestWorkflow {
    
    /**
     * Ingest news from NewsAPI for all configured sports
     */
    @WorkflowMethod
    void ingestNews();
}
