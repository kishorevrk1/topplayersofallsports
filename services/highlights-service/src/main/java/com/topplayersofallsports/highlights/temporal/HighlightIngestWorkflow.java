package com.topplayersofallsports.highlights.temporal;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;

/**
 * Temporal workflow interface for highlight ingestion.
 * 
 * Defines the contract for durable, fault-tolerant video highlight ingestion
 * from YouTube and other platforms.
 */
@WorkflowInterface
public interface HighlightIngestWorkflow {

    /**
     * Ingest highlights from a specific source.
     * 
     * @param sourceId ID of the HighlightSource to ingest from
     * @return Number of highlights ingested
     */
    @WorkflowMethod
    int ingestFromSource(Long sourceId);
}
