package com.topplayersofallsports.news.config;

import com.topplayersofallsports.news.temporal.NewsIngestActivitiesImpl;
import com.topplayersofallsports.news.temporal.NewsIngestWorkflow;
import com.topplayersofallsports.news.temporal.NewsIngestWorkflowImpl;
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
import org.springframework.scheduling.annotation.Scheduled;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

/**
 * Temporal configuration for news ingestion workflows
 */
@Slf4j
@Configuration
public class TemporalConfig {
    
    @Value("${temporal.host}")
    private String temporalHost;
    
    @Value("${temporal.port}")
    private int temporalPort;
    
    @Value("${temporal.namespace}")
    private String namespace;
    
    @Value("${temporal.task-queue}")
    private String taskQueue;
    
    @Value("${news.ingest.enabled}")
    private boolean ingestEnabled;
    
    private WorkflowServiceStubs service;
    private WorkflowClient client;
    private WorkerFactory factory;
    
    @Bean
    public WorkflowServiceStubs workflowServiceStubs() {
        if (service == null) {
            service = WorkflowServiceStubs.newServiceStubs(
                WorkflowServiceStubsOptions.newBuilder()
                    .setTarget(temporalHost + ":" + temporalPort)
                    .build()
            );
        }
        return service;
    }
    
    @Bean
    public WorkflowClient workflowClient(WorkflowServiceStubs service) {
        if (client == null) {
            client = WorkflowClient.newInstance(service);
        }
        return client;
    }
    
    @Bean
    public WorkerFactory workerFactory(
        WorkflowClient client,
        NewsIngestActivitiesImpl activities
    ) {
        if (factory == null) {
            factory = WorkerFactory.newInstance(client);
            Worker worker = factory.newWorker(taskQueue);
            
            // Register workflow implementation
            worker.registerWorkflowImplementationTypes(NewsIngestWorkflowImpl.class);
            
            // Register activities
            worker.registerActivitiesImplementations(activities);
            
            factory.start();
            log.info("Temporal worker started for task queue: {}", taskQueue);
        }
        return factory;
    }
    
    @PostConstruct
    public void init() {
        log.info("Temporal configuration initialized");
        log.info("Host: {}:{}, Namespace: {}, Task Queue: {}", 
            temporalHost, temporalPort, namespace, taskQueue);
        log.info("News ingestion enabled: {}", ingestEnabled);
    }
    
    /**
     * Schedule news ingestion every 6 hours
     */
    @Scheduled(cron = "${news.ingest.cron}")
    public void scheduleNewsIngestion() {
        if (!ingestEnabled) {
            log.debug("News ingestion is disabled");
            return;
        }
        
        try {
            log.info("Triggering scheduled news ingestion");
            
            NewsIngestWorkflow workflow = client.newWorkflowStub(
                NewsIngestWorkflow.class,
                WorkflowOptions.newBuilder()
                    .setTaskQueue(taskQueue)
                    .setWorkflowId("news-ingest-" + System.currentTimeMillis())
                    .build()
            );
            
            // Start workflow asynchronously
            WorkflowClient.start(workflow::ingestNews);
            
            log.info("News ingestion workflow started successfully");
        } catch (Exception e) {
            log.error("Error starting news ingestion workflow: {}", e.getMessage(), e);
        }
    }
    
    @PreDestroy
    public void cleanup() {
        if (factory != null) {
            factory.shutdown();
            log.info("Temporal worker factory shut down");
        }
        if (service != null) {
            service.shutdown();
            log.info("Temporal service stubs shut down");
        }
    }
}
