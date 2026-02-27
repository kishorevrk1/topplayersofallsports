# ⚽ Football Calendar Service

Production-grade Spring Boot microservice for managing football fixtures and calendar data.

## 🎯 Features

- **Top 4 Football Leagues**: Premier League, La Liga, World Cup, UEFA Champions League
- **Temporal Workflow Orchestration**: Automated daily syncing at 2 AM
- **Live Score Updates**: Real-time updates every 15 seconds
- **Redis Caching**: High-performance caching (1-hour TTL)
- **API-Sports.io Integration**: Reliable football data source
- **PostgreSQL Database**: Persistent fixture storage
- **Swagger UI**: Interactive API documentation
- **Production-Ready**: SOLID principles, clean architecture, comprehensive logging

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│                  http://localhost:5173                   │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────┐
│            Calendar Service (Spring Boot)                │
│                  http://localhost:8083                   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  REST Controllers                                 │  │
│  │  - GET /api/calendar/fixtures                    │  │
│  │  - GET /api/calendar/fixtures/top3               │  │
│  │  - GET /api/calendar/fixtures/live               │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Service Layer (Business Logic)                  │  │
│  │  - Fixture management                            │  │
│  │  - Caching strategy                              │  │
│  │  - Data transformation                           │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API-Sports Client (WebClient)                   │  │
│  │  - Retry logic (3 attempts)                      │  │
│  │  - Rate limiting                                 │  │
│  │  - Error handling                                │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Temporal Workflows                              │  │
│  │  - Daily sync (2 AM)                             │  │
│  │  - Live updates (15s)                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────────┐
    │PostgreSQL│      │  Redis   │     │ API-Sports.io│
    │   5432   │      │  6379    │     │  External    │
    └──────────┘      └──────────┘     └──────────────┘
```

## 📊 Database Schema

```sql
CREATE TABLE fixtures (
    id BIGSERIAL PRIMARY KEY,
    external_id BIGINT UNIQUE NOT NULL,
    
    -- League Info
    league_id INT NOT NULL,
    league_name VARCHAR(255) NOT NULL,
    league_country VARCHAR(100),
    season INT NOT NULL,
    round VARCHAR(100),
    
    -- Date & Venue
    fixture_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50),
    venue VARCHAR(255),
    venue_city VARCHAR(100),
    
    -- Teams
    home_team_id INT NOT NULL,
    home_team_name VARCHAR(255) NOT NULL,
    home_team_logo VARCHAR(500),
    away_team_id INT NOT NULL,
    away_team_name VARCHAR(255) NOT NULL,
    away_team_logo VARCHAR(500),
    
    -- Status & Scores
    status VARCHAR(10) NOT NULL,
    status_long VARCHAR(100),
    elapsed_time INT,
    is_live BOOLEAN,
    home_score INT,
    away_score INT,
    score_details TEXT,
    
    -- Metadata
    referee VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_fixture_date ON fixtures(fixture_date);
CREATE INDEX idx_league_season ON fixtures(league_id, season);
CREATE INDEX idx_status ON fixtures(status);
CREATE INDEX idx_external_id ON fixtures(external_id);
```

## 🚀 Quick Start

### Prerequisites

- Java 17+
- Maven 3.9+
- Docker & Docker Compose

### 1. Start Infrastructure

```bash
cd services/calendar-service
docker-compose up -d
```

This starts PostgreSQL, Redis, Temporal, and Temporal UI.

### 2. Build the Service

```bash
mvn clean package -DskipTests
```

### 3. Run the Service Locally

```bash
# Option A: Run with Maven (Recommended)
mvn spring-boot:run

# Option B: Run JAR directly
java -jar target/calendar-service-1.0.0.jar
```

The service will connect to the infrastructure running in Docker.

### 4. Verify Service is Running

```bash
curl http://localhost:8083/api/calendar/health
```

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/fixtures` | Get fixtures for a date |
| GET | `/api/calendar/fixtures/top3` | Get top 3 matches today |
| GET | `/api/calendar/fixtures/top3/{date}` | Get top 3 matches by date |
| GET | `/api/calendar/fixtures/live` | Get live fixtures |
| GET | `/api/calendar/fixtures/range` | Get fixtures by date range |
| GET | `/api/calendar/health` | Health check |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calendar/admin/sync` | Manually sync fixtures |
| POST | `/api/calendar/admin/sync/range` | Sync fixtures range |
| POST | `/api/calendar/admin/live/update` | Update live fixtures |

### Examples

#### Get Today's Fixtures
```bash
curl http://localhost:8083/api/calendar/fixtures
```

#### Get Top 3 Matches for Today
```bash
curl http://localhost:8083/api/calendar/fixtures/top3
```

#### Get Fixtures for Specific Date
```bash
curl "http://localhost:8083/api/calendar/fixtures?date=2025-11-25"
```

#### Get Live Fixtures
```bash
curl http://localhost:8083/api/calendar/fixtures/live
```

#### Get Fixtures Range
```bash
curl "http://localhost:8083/api/calendar/fixtures/range?startDate=2025-11-20&endDate=2025-11-30"
```

#### Manual Sync (Admin)
```bash
curl -X POST "http://localhost:8083/api/calendar/admin/sync?date=2025-11-25"
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| SERVER_PORT | 8083 | Service port |
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | topplayersofallsports | Database name |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| TEMPORAL_HOST | localhost | Temporal server host |
| TEMPORAL_PORT | 7233 | Temporal server port |
| API_SPORTS_KEY | (required) | API-Sports.io API key |

### Leagues Configuration

The service tracks these 4 top football leagues:

1. **Premier League** (England) - ID: 39
2. **La Liga** (Spain) - ID: 140
3. **World Cup** - ID: 1
4. **UEFA Champions League** - ID: 2

### Temporal Workflows

- **Daily Sync**: Runs at 2 AM daily (cron: `0 0 2 * * ?`)
- **Live Updates**: Every 15 seconds
- **Syncs**: Next 7 days of fixtures

## 📚 Documentation

### Swagger UI
Access interactive API documentation:
```
http://localhost:8083/swagger-ui.html
```

### Temporal UI
Monitor workflows and activities:
```
http://localhost:8080
```

### Actuator Endpoints
Health and metrics:
```
http://localhost:8083/actuator/health
http://localhost:8083/actuator/metrics
```

## 🧪 Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Run with coverage
mvn clean test jacoco:report
```

## 📦 Deployment

### Docker Production Build

```bash
# Build image
docker build -t calendar-service:1.0.0 .

# Run container
docker run -d \
  -p 8083:8083 \
  -e DB_HOST=your-db-host \
  -e REDIS_HOST=your-redis-host \
  -e TEMPORAL_HOST=your-temporal-host \
  -e API_SPORTS_KEY=your-api-key \
  calendar-service:1.0.0
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: calendar-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: calendar-service
  template:
    metadata:
      labels:
        app: calendar-service
    spec:
      containers:
      - name: calendar-service
        image: calendar-service:1.0.0
        ports:
        - containerPort: 8083
        env:
        - name: DB_HOST
          value: postgres-service
        - name: REDIS_HOST
          value: redis-service
        - name: TEMPORAL_HOST
          value: temporal-service
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## 🔒 Security

- Non-root container user
- API key stored in environment variables
- CORS configured for frontend
- Input validation on all endpoints
- Rate limiting on external API calls

## 📊 Monitoring

### Logs
```bash
# View service logs
docker-compose logs -f calendar-service

# View Temporal logs
docker-compose logs -f temporal
```

### Metrics
- **Prometheus**: http://localhost:8083/actuator/prometheus
- **Health**: http://localhost:8083/actuator/health
- **Info**: http://localhost:8083/actuator/info

## 🐛 Troubleshooting

### Service won't start
1. Check if ports 8083, 5432, 6379, 7233 are available
2. Verify PostgreSQL and Redis are running: `docker-compose ps`
3. Check logs: `docker-compose logs calendar-service`

### No fixtures data
1. Trigger manual sync: `curl -X POST http://localhost:8083/api/calendar/admin/sync`
2. Verify API key is correct in environment variables
3. Check API-Sports.io quota: https://dashboard.api-football.com

### Temporal connection issues
1. Verify Temporal is running: `docker-compose ps temporal`
2. Check Temporal UI: http://localhost:8080
3. Restart worker: `docker-compose restart calendar-service`

## 🤝 Contributing

1. Follow SOLID principles
2. Write unit tests for new features
3. Update documentation
4. Use conventional commits

## 📄 License

Proprietary - TopPlayersOfAllSports

## 🔗 Links

- **Swagger UI**: http://localhost:8083/swagger-ui.html
- **Temporal UI**: http://localhost:8080
- **API-Sports Docs**: https://www.api-football.com/documentation-v3

---

**Built with ❤️ for TopPlayersOfAllSports**
