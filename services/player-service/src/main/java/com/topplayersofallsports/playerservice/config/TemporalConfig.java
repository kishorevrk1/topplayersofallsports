package com.topplayersofallsports.playerservice.config;

import com.topplayersofallsports.playerservice.temporal.activity.BatchRegistrationActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerEnrichmentActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRankingActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.activity.PlayerRegistrationActivitiesImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.BatchPlayerRegistrationWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerEnrichmentWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerRankingWorkflowImpl;
import com.topplayersofallsports.playerservice.temporal.workflow.PlayerRegistrationWorkflowImpl;
import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowClientOptions;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.SmartLifecycle;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Temporal configuration — wires up the WorkflowClient, WorkerFactory, and Worker as proper
 * Spring beans, then uses SmartLifecycle to start/stop the worker in the correct Spring lifecycle phase.
 *
 * Why SmartLifecycle instead of @PostConstruct/@PreDestroy:
 *  - SmartLifecycle.start() is called AFTER all beans are fully initialized (no ordering surprises).
 *  - SmartLifecycle.stop() participates in Spring's graceful shutdown (signals the JVM shutdown hook).
 *  - The worker starts only when the entire application context is ready.
 *
 * All beans are @ConditionalOnProperty so the whole Temporal subsystem is skipped when
 * temporal.enabled=false (e.g. in tests or when Temporal server is not running).
 */
@Configuration
@ConditionalOnProperty(name = "temporal.enabled", havingValue = "true")
@Slf4j
@RequiredArgsConstructor
public class TemporalConfig implements SmartLifecycle {

    @Value("${temporal.connection.target:localhost:7233}")
    private String temporalServerAddress;

    @Value("${temporal.namespace:default}")
    private String temporalNamespace;

    @Value("${temporal.worker.task-queue:player-registration}")
    private String taskQueue;

    // Activity implementations — injected by Spring
    private final PlayerRegistrationActivitiesImpl registrationActivities;
    private final BatchRegistrationActivitiesImpl batchActivities;
    private final PlayerRankingActivitiesImpl rankingActivities;
    private final PlayerEnrichmentActivitiesImpl enrichmentActivities;

    private volatile boolean running = false;
    private WorkerFactory workerFactory; // set by configuredWorkerFactory() @Bean

    // ── Beans ────────────────────────────────────────────────────────────────────

    @Bean
    public WorkflowServiceStubs workflowServiceStubs() {
        log.info("Configuring Temporal service stubs → {}", temporalServerAddress);
        return WorkflowServiceStubs.newServiceStubs(
                WorkflowServiceStubsOptions.newBuilder()
                        .setTarget(temporalServerAddress)
                        .build());
    }

    @Bean
    public WorkflowClient workflowClient(WorkflowServiceStubs serviceStubs) {
        return WorkflowClient.newInstance(serviceStubs,
                WorkflowClientOptions.newBuilder()
                        .setNamespace(temporalNamespace)
                        .build());
    }

    /**
     * Creates the WorkerFactory, registers all workflow and activity implementations,
     * but does NOT call factory.start() here — that is done by SmartLifecycle.start()
     * after the full application context is ready.
     */
    @Bean
    public WorkerFactory configuredWorkerFactory(WorkflowClient workflowClient) {
        WorkerFactory factory = WorkerFactory.newInstance(workflowClient);
        Worker worker = factory.newWorker(taskQueue);

        worker.registerWorkflowImplementationTypes(
                PlayerRegistrationWorkflowImpl.class,
                BatchPlayerRegistrationWorkflowImpl.class,
                PlayerRankingWorkflowImpl.class,
                PlayerEnrichmentWorkflowImpl.class
        );

        worker.registerActivitiesImplementations(
                registrationActivities,
                batchActivities,
                rankingActivities,
                enrichmentActivities
        );

        this.workerFactory = factory;
        log.info("Temporal worker configured — task queue: {}", taskQueue);
        return factory;
    }

    // ── SmartLifecycle ───────────────────────────────────────────────────────────

    /**
     * Called by Spring after the entire application context is refreshed.
     * This is the correct place to start the Temporal worker — all Spring beans
     * (including JPA repositories used by activity impls) are fully ready.
     */
    @Override
    public void start() {
        if (workerFactory == null || running) return;
        try {
            workerFactory.start();
            running = true;
            log.info("✅ Temporal worker started — listening on task queue: {}", taskQueue);
        } catch (Exception e) {
            log.error("❌ Failed to start Temporal worker: {}", e.getMessage());
            log.warn("Make sure Temporal server is running: docker run -p 7233:7233 temporalio/auto-setup:latest");
        }
    }

    /**
     * Called during Spring context shutdown. Temporal SDK's shutdown() drains in-flight
     * activity executions before closing, ensuring clean handoff to Temporal server.
     */
    @Override
    public void stop() {
        if (workerFactory != null && running) {
            log.info("Shutting down Temporal worker (draining in-flight tasks)...");
            workerFactory.shutdown();
            running = false;
            log.info("✅ Temporal worker stopped");
        }
    }

    @Override
    public boolean isRunning() {
        return running;
    }

    /**
     * High phase = start late (after all infrastructure beans), stop early (before them).
     */
    @Override
    public int getPhase() {
        return Integer.MAX_VALUE - 100;
    }
}
