# 🔄 Temporal-Based Player Registration Workflow

## Overview

**Temporal orchestrates the complete player registration process**, handling AI calls, API interactions, and database operations with built-in retry logic, fault tolerance, and observability.

---

## ✅ Why Temporal?

### Problems Solved

1. **Rate Limit Handling** - Automatic exponential backoff for 429 errors
2. **Reliability** - Workflows survive service restarts
3. **Observability** - See exactly what's happening in Temporal UI
4. **Long-Running Processes** - Player registration can take minutes (AI + API calls)
5. **Fault Tolerance** - Automatic retries with configurable policies
6. **Compensation** - Rollback logic if registration fails partway

---

## 🎯 Workflow Architecture

```
PlayerRegistrationWorkflow
    │
    ├──> Activity 1: searchPlayerWithAI
    │    └─ Uses DeepSeek R1 via OpenRouter
    │    └─ Retry: 5 attempts, 10s → 5min backoff
    │    └─ Handles: 429 rate limits
    │
    ├──> Activity 2: checkExistingPlayer
    │    └─ Query database for duplicates
    │    └─ Retry: 3 attempts, fast
    │
    ├──> Activity 3: fetchPlayerFromAPI
    │    └─ Calls API-Sports.io
    │    └─ Retry: 3 attempts, 5s → 2min backoff
    │    └─ Handles: 429, network failures
    │
    ├──> Activity 4: generateAIAnalysis
    │    └─ DeepSeek R1 for rating & biography
    │    └─ Retry: 5 attempts, 10s → 5min backoff
    │    └─ Handles: 429 rate limits
    │
    └──> Activity 5: savePlayerProfile
         └─ Persist to PostgreSQL
         └─ Retry: 3 attempts, fast
```

---

## 📦 What's Been Created

### 1. Workflow Interface
```java
@WorkflowInterface
public interface PlayerRegistrationWorkflow {
    @WorkflowMethod
    PlayerRegistrationResponse registerPlayer(PlayerRegistrationRequest request);
}
```

### 2. Workflow Implementation
- **5 orchestrated activities**
- **Separate retry policies** for AI, API, and DB calls
- **Error handling** with graceful fallbacks
- **Logging** at each step

### 3. Activities Interface
```java
@ActivityInterface
public interface PlayerRegistrationActivities {
    PlayerSearchResult searchPlayerWithAI(...);
    PlayerRegistrationResponse checkExistingPlayer(...);
    String fetchPlayerFromAPI(...);
    String generateAIAnalysis(...);
    PlayerRegistrationResponse savePlayerProfile(...);
}
```

---

## ⚙️ Retry Policies

### AI Calls (OpenRouter)
```java
RetryOptions:
  - Initial: 10 seconds
  - Maximum: 5 minutes
  - Backoff: 2x multiplier
  - Max Attempts: 5
  - Timeout: 2 minutes per attempt
```

**Handles:**
- 429 Too Many Requests
- Network timeouts
- Temporary API failures

### API Calls (API-Sports)
```java
RetryOptions:
  - Initial: 5 seconds
  - Maximum: 2 minutes
  - Backoff: 2x multiplier
  - Max Attempts: 3
  - Timeout: 1 minute per attempt
```

**Handles:**
- Rate limits
- Network issues
- Temporary outages

### Database Operations
```java
RetryOptions:
  - Initial: 1 second
  - Maximum: 10 seconds
  - Backoff: 1.5x multiplier
  - Max Attempts: 3
  - Timeout: 30 seconds per attempt
```

**Handles:**
- Connection failures
- Deadlocks
- Temporary DB issues

---

## 🚀 Next Steps to Complete

### Step 1: Implement Activities
Create `PlayerRegistrationActivitiesImpl.java`:
```java
@Component
public class PlayerRegistrationActivitiesImpl implements PlayerRegistrationActivities {
    @Override
    public PlayerSearchResult searchPlayerWithAI(...) {
        // Use existing PlayerSearchService
    }
    
    @Override
    public String fetchPlayerFromAPI(...) {
        // Use existing FootballDataClient
    }
    
    // ... implement other activities
}
```

### Step 2: Configure Temporal
Create `TemporalConfig.java`:
```java
@Configuration
public class TemporalConfig {
    @Bean
    public WorkflowClient workflowClient() {
        WorkflowServiceStubs service = WorkflowServiceStubs.newLocalServiceStubs();
        return WorkflowClient.newInstance(service);
    }
    
    @Bean
    public WorkerFactory workerFactory(WorkflowClient client) {
        return WorkerFactory.newInstance(client);
    }
}
```

### Step 3: Update Controller
```java
@PostMapping("/register")
public ResponseEntity<PlayerRegistrationResponse> registerPlayer(@RequestBody PlayerRegistrationRequest request) {
    // Start Temporal workflow
    WorkflowClient client = ...;
    PlayerRegistrationWorkflow workflow = client.newWorkflowStub(
        PlayerRegistrationWorkflow.class,
        WorkflowOptions.newBuilder()
            .setTaskQueue("player-registration")
            .setWorkflowId("player-" + UUID.randomUUID())
            .build()
    );
    
    // Execute async (returns immediately)
    WorkflowExecution execution = WorkflowClient.start(workflow::registerPlayer, request);
    
    return ResponseEntity.accepted().body(
        PlayerRegistrationResponse.builder()
            .status("PENDING")
            .message("Player registration started")
            .workflowId(execution.getWorkflowId())
            .build()
    );
}
```

### Step 4: Start Temporal Worker
```java
@Component
public class TemporalWorker {
    @PostConstruct
    public void startWorker() {
        WorkerFactory factory = ...;
        Worker worker = factory.newWorker("player-registration");
        
        // Register workflow
        worker.registerWorkflowImplementationTypes(PlayerRegistrationWorkflowImpl.class);
        
        // Register activities
        worker.registerActivitiesImplementations(new PlayerRegistrationActivitiesImpl(...));
        
        factory.start();
    }
}
```

---

## 🎯 Benefits

### 1. **Rate Limit Resilience**
```
Request 1: 429 → wait 10s → retry
Request 2: 429 → wait 20s → retry
Request 3: 429 → wait 40s → retry
...
```

### 2. **Service Restart Tolerance**
```
1. User registers "Mbappe"
2. Workflow starts, completes AI search
3. Service crashes!
4. Service restarts
5. Workflow resumes from step 3 (fetch API)
```

### 3. **Observability**
- View workflow status in Temporal UI
- See which step is running
- Check retry attempts
- Inspect errors and stack traces

### 4. **Async Processing**
```
User → POST /register → 202 Accepted (immediate)
                          ↓
                    Temporal Workflow
                     (runs in background)
                          ↓
                    Webhook on completion
```

---

## 📊 Monitoring

### Temporal UI
```
http://localhost:8088
```

View:
- Active workflows
- Workflow history
- Activity retries
- Error details
- Performance metrics

---

## 🔧 Configuration

### application.yml
```yaml
temporal:
  connection:
    target: localhost:7233
  namespace: default
  worker:
    task-queue: player-registration
    max-concurrent-activities: 10
    max-concurrent-workflows: 5
```

---

## 💡 Usage Examples

### 1. Synchronous (wait for result)
```java
PlayerRegistrationResponse response = workflow.registerPlayer(request);
```

### 2. Asynchronous (return immediately)
```java
WorkflowClient.start(workflow::registerPlayer, request);
// Returns workflow ID immediately
```

### 3. Query Status
```java
WorkflowExecution execution = ...;
PlayerRegistrationResponse status = workflow.getStatus();
```

---

## 🎯 Testing

### Mock Mode
Activities can use mock data when rate limits hit:
```java
if (rateLimitExceeded()) {
    return mockPlayerData();
}
```

### Unit Testing
```java
@Test
public void testWorkflow() {
    TestWorkflowEnvironment testEnv = TestWorkflowEnvironment.newInstance();
    Worker worker = testEnv.newWorker("test-queue");
    
    worker.registerWorkflowImplementationTypes(PlayerRegistrationWorkflowImpl.class);
    
    // Test workflow
    testEnv.start();
    PlayerRegistrationWorkflow workflow = testEnv.newWorkflowStub(...);
    PlayerRegistrationResponse result = workflow.registerPlayer(...);
    
    assertTrue(result.isSuccess());
}
```

---

## 🚦 Status Flow

```
Request Received
    ↓
PENDING (workflow started)
    ↓
SEARCHING (AI searching for player)
    ↓
FETCHING (getting API data)
    ↓
ANALYZING (AI generating rating)
    ↓
SAVING (persisting to DB)
    ↓
SUCCESS / FAILED
```

---

## 📈 Scalability

### Horizontal Scaling
```
Worker 1: Handles workflows 1-100
Worker 2: Handles workflows 101-200
Worker 3: Handles workflows 201-300
```

All workers process from same queue!

### Rate Limit Distribution
```
3 workers = 3x throughput
Each with independent retry policies
Automatic load balancing
```

---

## 🛡️ Error Scenarios

### Scenario 1: OpenRouter Rate Limit
```
1. Activity: searchPlayerWithAI
2. Error: 429 Too Many Requests
3. Temporal: Wait 10 seconds
4. Retry automatically
5. Success on retry #2
```

### Scenario 2: Service Crash
```
1. Workflow at step 3 (fetchPlayerFromAPI)
2. Service crashes
3. Temporal: Workflow state saved
4. Service restarts
5. Workflow resumes from step 3
6. No data loss!
```

### Scenario 3: API-Sports Down
```
1. Activity: fetchPlayerFromAPI
2. Error: Connection refused
3. Temporal: Retry with backoff
4. After 3 attempts: Return error
5. Workflow: Handle gracefully
```

---

## 🎓 Learning Resources

- **Temporal Docs**: https://docs.temporal.io
- **Java SDK**: https://github.com/temporalio/sdk-java
- **Samples**: https://github.com/temporalio/samples-java

---

**Temporal makes your player registration workflow bulletproof!** 🚀
