package com.topplayersofallsports.playerservice.service;

import com.topplayersofallsports.playerservice.temporal.workflow.AllSportsRankingWorkflow;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Optional service to auto-initialize all sports rankings on startup
 * Enable via application property: ranking.auto-initialize=true
 */
@Service
@Slf4j
public class RankingInitializationService {
    
    @Autowired(required = false)
    private WorkflowClient workflowClient;
    
    @Value("${ranking.auto-initialize:false}")
    private boolean autoInitialize;
    
    @Value("${ranking.auto-initialize-delay-seconds:30}")
    private int delaySeconds;
    
    /**
     * Optionally auto-initialize all sports rankings on startup
     * Only runs if ranking.auto-initialize=true in application.yml
     */
    @PostConstruct
    public void autoInitializeIfEnabled() {
        if (!autoInitialize) {
            log.info("Auto-initialization disabled. Set ranking.auto-initialize=true to enable.");
            return;
        }
        
        if (workflowClient == null) {
            log.warn("⚠️ Cannot auto-initialize: Temporal is disabled or WorkflowClient not available");
            log.warn("To enable, set temporal.enabled=true and ensure Temporal server is running");
            return;
        }
        
        log.info("🚀 AUTO-INITIALIZATION ENABLED! Will start ranking workflow in {}s...", delaySeconds);
        
        // Run in background thread to not block startup
        new Thread(() -> {
            try {
                // Wait for services to fully start
                Thread.sleep(delaySeconds * 1000L);
                
                log.info("Starting automatic top 50 initialization for all sports...");
                
                String workflowId = "ranking-init-all-auto-" + System.currentTimeMillis();
                
                WorkflowOptions options = WorkflowOptions.newBuilder()
                    .setTaskQueue("player-registration")
                    .setWorkflowId(workflowId)
                    .build();
                
                AllSportsRankingWorkflow workflow = workflowClient.newWorkflowStub(
                    AllSportsRankingWorkflow.class, options);
                
                // Start workflow
                WorkflowClient.start(workflow::initializeAllSports);
                
                log.info("✅ Auto-initialization workflow started: {}", workflowId);
                log.info("Monitor logs for progress. This will take 15-20 minutes for all 5 sports (250 players).");
                
            } catch (InterruptedException e) {
                log.warn("Auto-initialization interrupted: {}", e.getMessage());
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("Failed to auto-initialize rankings: {}", e.getMessage(), e);
            }
        }, "ranking-auto-init").start();
    }
}
