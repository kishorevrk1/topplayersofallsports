package com.topplayers.calendar.config;

import com.topplayers.calendar.temporal.FixtureSyncWorkflow;
import com.topplayers.calendar.temporal.FixtureSyncWorkflowImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

/**
 * Temporal Configuration
 * Sets up Temporal client, workers, and workflow scheduling
 */
@Configuration
@Slf4j
public class TemporalConfig {

    @Value("${temporal.connection.target:localhost:7233}")
    private String temporalTarget;

    @Value("${temporal.namespace:default}")
    private String namespace;

    @Value("${temporal.task-queue:calendar-service-tasks}")
    private String taskQueue;

    private WorkerFactory workerFactory;
    private WorkflowClient workflowClient;

    @Bean
    public WorkflowServiceStubs workflowServiceStubs() {
        log.info("Connecting to Temporal server at: {}", temporalTarget);
        
        WorkflowServiceStubsOptions options = WorkflowServiceStubsOptions.newBuilder()
                .setTarget(temporalTarget)
                .build();
        
        return WorkflowServiceStubs.newServiceStubs(options);
    }

    @Bean
    public WorkflowClient workflowClient(WorkflowServiceStubs serviceStubs) {
        log.info("Creating Temporal WorkflowClient for namespace: {}", namespace);
        
        this.workflowClient = WorkflowClient.newInstance(serviceStubs, 
                io.temporal.client.WorkflowClientOptions.newBuilder()
                        .setNamespace(namespace)
                        .build());
        
        return this.workflowClient;
    }

    @Bean
    public WorkerFactory workerFactory(WorkflowClient workflowClient) {
        log.info("Creating Temporal WorkerFactory for task queue: {}", taskQueue);
        
        this.workerFactory = WorkerFactory.newInstance(workflowClient);
        
        Worker worker = workerFactory.newWorker(taskQueue);
        
        // Register workflow implementations
        worker.registerWorkflowImplementationTypes(FixtureSyncWorkflowImpl.class);
        
        log.info("Registered workflow: FixtureSyncWorkflowImpl");
        
        return workerFactory;
    }

    @PostConstruct
    public void startWorker() {
        if (workerFactory != null) {
            log.info("Starting Temporal workers...");
            workerFactory.start();
            log.info("Temporal workers started successfully");
        }
    }

    @PreDestroy
    public void stopWorker() {
        if (workerFactory != null) {
            log.info("Shutting down Temporal workers...");
            workerFactory.shutdown();
            log.info("Temporal workers shut down successfully");
        }
    }

    /**
     * Get workflow stub for scheduling
     */
    public FixtureSyncWorkflow getFixtureSyncWorkflow(String workflowId) {
        WorkflowOptions options = WorkflowOptions.newBuilder()
                .setWorkflowId(workflowId)
                .setTaskQueue(taskQueue)
                .build();
        
        return workflowClient.newWorkflowStub(FixtureSyncWorkflow.class, options);
    }
}
