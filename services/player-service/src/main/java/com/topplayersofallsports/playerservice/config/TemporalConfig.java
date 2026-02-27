package com.topplayersofallsports.playerservice.config;

import com.topplayersofallsports.playerservice.temporal.activity.BatchRegistrationActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerEnrichmentActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRankingActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRegistrationActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.AllSportsRankingWorkflow;
import com.topplayersofallsports.playerservice.temporal.workflow.BatchPlayerRegistrationWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerEnrichmentWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerRankingWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerRegistrationWorkflowImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Temporal Configuration
 * Sets up connection to Temporal Server and registers workers
 */
@Configuration
@Slf4j
@RequiredArgsConstructor
public class TemporalConfig {
    
    @Value("${temporal.connection.target:localhost:7233}")
    private String temporalServerAddress;
    
    @Value("${temporal.namespace:default}")
    private String temporalNamespace;
    
    @Value("${temporal.worker.task-queue:player-registration}")
    private String taskQueue;
    
    private final PlayerRegistrationActivitiesImpl activities;
    private final BatchRegistrationActivitiesImpl batchActivities;
    private final PlayerRankingActivitiesImpl rankingActivities;
    private final PlayerEnrichmentActivitiesImpl enrichmentActivities;
    
    @Value("${temporal.enabled:false}")
    private boolean temporalEnabled;
    
    private WorkerFactory workerFactory;
    private WorkflowClient workflowClient;
    
    @Bean
    @ConditionalOnProperty(name = "temporal.enabled", havingValue = "true")
    public WorkflowServiceStubs workflowServiceStubs() {
        log.info("Connecting to Temporal server at: {}", temporalServerAddress);
        
        return WorkflowServiceStubs.newServiceStubs(
            WorkflowServiceStubsOptions.newBuilder()
                .setTarget(temporalServerAddress)
                .build()
        );
    }
    
    @Bean
    @ConditionalOnProperty(name = "temporal.enabled", havingValue = "true")
    public WorkflowClient workflowClient(WorkflowServiceStubs serviceStubs) {
        return WorkflowClient.newInstance(
            serviceStubs,
            io.temporal.client.WorkflowClientOptions.newBuilder()
                .setNamespace(temporalNamespace)
                .build()
        );
    }
    
    @Bean
    @ConditionalOnProperty(name = "temporal.enabled", havingValue = "true")
    public WorkerFactory workerFactory(WorkflowClient workflowClient) {
        return WorkerFactory.newInstance(workflowClient);
    }
    
    /**
     * Start Temporal worker on application startup
     */
    @PostConstruct
    public void startWorker() {
        if (!temporalEnabled) {
            log.info("⚠️ Temporal is DISABLED - workflows will not be available");
            log.info("To enable Temporal, set temporal.enabled=true and ensure Temporal server is running");
            return;
        }
        
        try {
            log.info("Starting Temporal worker for task queue: {}", taskQueue);
            
            // Create service stubs
            WorkflowServiceStubs serviceStubs = WorkflowServiceStubs.newServiceStubs(
                WorkflowServiceStubsOptions.newBuilder()
                    .setTarget(temporalServerAddress)
                    .build()
            );
            
            // Create workflow client
            workflowClient = WorkflowClient.newInstance(
                serviceStubs,
                io.temporal.client.WorkflowClientOptions.newBuilder()
                    .setNamespace(temporalNamespace)
                    .build()
            );
            
            // Create worker factory
            workerFactory = WorkerFactory.newInstance(workflowClient);
            
            Worker worker = workerFactory.newWorker(taskQueue);
            
            // Register workflow implementations
            worker.registerWorkflowImplementationTypes(
                PlayerRegistrationWorkflowImpl.class,
                BatchPlayerRegistrationWorkflowImpl.class,
                PlayerRankingWorkflowImpl.class,
                PlayerEnrichmentWorkflowImpl.class
            );
            
            // Register activity implementations
            worker.registerActivitiesImplementations(activities, batchActivities, rankingActivities, enrichmentActivities);
            
            // Start the worker
            workerFactory.start();
            
            log.info("✅ Temporal worker started successfully on task queue: {}", taskQueue);
            log.info("Worker is ready to process player registration workflows");
            
        } catch (Exception e) {
            log.error("❌ Failed to start Temporal worker: {}", e.getMessage(), e);
            log.warn("Player registration workflows will not work without Temporal server");
            log.warn("To start Temporal: docker run -p 7233:7233 temporalio/auto-setup:latest");
        }
    }
    
    /**
     * Shutdown worker gracefully on application shutdown
     */
    @PreDestroy
    public void shutdownWorker() {
        if (workerFactory != null) {
            log.info("Shutting down Temporal worker...");
            workerFactory.shutdown();
            log.info("✅ Temporal worker shutdown complete");
        }
    }
}
