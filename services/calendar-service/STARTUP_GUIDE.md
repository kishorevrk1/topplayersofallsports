# 🚀 Calendar Service - Quick Start Guide

## ⚽ What's Built

A **production-grade Spring Boot microservice** for football fixtures with:

- ✅ **Top 4 Leagues**: Premier League, La Liga, World Cup, Champions League
- ✅ **Temporal Workflows**: Automated syncing at 2 AM daily
- ✅ **Live Updates**: Real-time scores every 15 seconds
- ✅ **Redis Caching**: 1-hour TTL for performance
- ✅ **PostgreSQL**: Persistent fixture storage
- ✅ **Swagger UI**: Interactive API documentation
- ✅ **Docker**: Full containerization with docker-compose

---

## 📦 Project Structure

```
services/calendar-service/
├── src/main/java/com/topplayers/calendar/
│   ├── CalendarServiceApplication.java          # Main application
│   ├── config/
│   │   ├── LeagueConfig.java                    # Top 4 leagues configuration
│   │   ├── WebClientConfig.java                 # API-Sports.io client setup
│   │   └── TemporalConfig.java                  # Temporal workflow config
│   ├── entity/
│   │   └── Fixture.java                         # Database entity
│   ├── repository/
│   │   └── FixtureRepository.java               # JPA repository
│   ├── dto/
│   │   └── FixtureDTO.java                      # API response format
│   ├── client/
│   │   └── ApiSportsClient.java                 # External API client
│   ├── service/
│   │   └── FixtureService.java                  # Business logic
│   ├── controller/
│   │   └── FixtureController.java               # REST endpoints
│   ├── temporal/
│   │   ├── FixtureSyncWorkflow.java             # Workflow interface
│   │   ├── FixtureSyncWorkflowImpl.java         # Workflow implementation
│   │   ├── FixtureSyncActivities.java           # Activities interface
│   │   └── FixtureSyncActivitiesImpl.java       # Activities implementation
│   └── scheduler/
│       └── FixtureSyncScheduler.java            # Scheduled tasks
├── src/main/resources/
│   ├── application.yml                          # Main configuration
│   └── application-resilience4j.yml             # Retry & circuit breaker config
├── Dockerfile                                    # Container image
├── docker-compose.yml                            # Multi-container setup
├── pom.xml                                       # Maven dependencies
└── README.md                                     # Full documentation
```

---

## 🎯 Step-by-Step Startup

### Step 1: Start Infrastructure (Required Services)

```bash
cd services/calendar-service

# Start PostgreSQL, Redis, and Temporal
docker-compose up -d postgres redis temporal temporal-ui

# Verify services are running
docker-compose ps
```

Expected output:
```
NAME                  STATUS          PORTS
calendar-postgres     Up (healthy)    0.0.0.0:5432->5432/tcp
calendar-redis        Up (healthy)    0.0.0.0:6379->6379/tcp
calendar-temporal     Up              0.0.0.0:7233->7233/tcp
calendar-temporal-ui  Up              0.0.0.0:8080->8080/tcp
```

### Step 2: Build the Service

```bash
# Clean build
mvn clean package -DskipTests

# This will create: target/calendar-service-1.0.0.jar
```

### Step 3: Run the Service Locally

**Option A: Run with Maven (Recommended for Development)**
```bash
mvn spring-boot:run
```

**Option B: Run JAR directly**
```bash
java -jar target/calendar-service-1.0.0.jar
```

### Step 4: Verify Service is Running

```bash
# Health check
curl http://localhost:8083/api/calendar/health

# Expected: "Calendar Service is healthy"
```

### Step 5: Trigger Initial Sync

```bash
# Sync today's fixtures
curl -X POST "http://localhost:8083/api/calendar/admin/sync"

# Expected: "Sync completed for 2025-11-23"
```

### Step 6: Test API Endpoints

```bash
# Get today's fixtures
curl http://localhost:8083/api/calendar/fixtures

# Get top 3 matches
curl http://localhost:8083/api/calendar/fixtures/top3

# Get live fixtures
curl http://localhost:8083/api/calendar/fixtures/live
```

---

## 🌐 Access Web UIs

| Service | URL | Description |
|---------|-----|-------------|
| **Calendar API** | http://localhost:8083/api/calendar/fixtures | REST API |
| **Swagger UI** | http://localhost:8083/swagger-ui.html | Interactive API docs |
| **Temporal UI** | http://localhost:8080 | Workflow monitoring |
| **Health Check** | http://localhost:8083/actuator/health | Service health |

---

## 📊 API Endpoints Quick Reference

### Get Fixtures
```bash
# Today's fixtures
curl http://localhost:8083/api/calendar/fixtures

# Specific date
curl "http://localhost:8083/api/calendar/fixtures?date=2025-11-25"

# Date range
curl "http://localhost:8083/api/calendar/fixtures/range?startDate=2025-11-20&endDate=2025-11-30"
```

### Get Top 3 Matches (Calendar UI Feature)
```bash
# Today's top 3
curl http://localhost:8083/api/calendar/fixtures/top3

# Specific date top 3
curl http://localhost:8083/api/calendar/fixtures/top3/2025-11-25
```

### Live Updates
```bash
# Get all live fixtures
curl http://localhost:8083/api/calendar/fixtures/live
```

### Admin Operations
```bash
# Manual sync
curl -X POST "http://localhost:8083/api/calendar/admin/sync?date=2025-11-25"

# Sync date range
curl -X POST "http://localhost:8083/api/calendar/admin/sync/range?startDate=2025-11-20&endDate=2025-11-30"

# Force live update
curl -X POST http://localhost:8083/api/calendar/admin/live/update
```

---

## 🔄 Frontend Integration

The frontend calendar page is already configured to use this backend!

### Calendar UI Features:
1. **Monthly Calendar**: Shows fixtures for entire month
2. **Top 3 Matches**: Below calendar, shows 3 most important matches
3. **Date Selection**: Click any date to see that day's fixtures
4. **Default View**: Shows today's top 3 matches on load

### Frontend Methods Added:
```javascript
// In src/services/calendarApiService.js

// Get top 3 matches for today
await calendarApiService.getTop3TodaysMatches();

// Get top 3 matches for specific date
await calendarApiService.getTop3MatchesByDate('2025-11-25');
```

---

## 🔧 Configuration

### Leagues (Configured in application.yml)

1. **Premier League** (England)
   - ID: 39
   - Season: 2024
   - Priority: 1

2. **La Liga** (Spain)
   - ID: 140
   - Season: 2024
   - Priority: 2

3. **World Cup**
   - ID: 1
   - Season: 2026
   - Priority: 3

4. **UEFA Champions League**
   - ID: 2
   - Season: 2024
   - Priority: 4

### Automated Syncing

- **Daily Sync**: 2 AM every day (next 7 days)
- **Live Updates**: Every 15 seconds
- **Initial Sync**: On application startup

---

## 🐛 Troubleshooting

### Problem: Service won't start

**Solution:**
```bash
# Check if ports are available
netstat -an | findstr "8083 5432 6379 7233"

# Stop any conflicting services
docker-compose down

# Restart everything
docker-compose up -d
```

### Problem: No fixtures data

**Solution:**
```bash
# Check if sync ran
curl http://localhost:8083/api/calendar/fixtures

# If empty, trigger manual sync
curl -X POST http://localhost:8083/api/calendar/admin/sync

# Check logs
docker-compose logs calendar-service
```

### Problem: Temporal connection error

**Solution:**
```bash
# Verify Temporal is running
docker-compose ps temporal

# Restart Temporal
docker-compose restart temporal

# Wait 10 seconds, then restart calendar service
docker-compose restart calendar-service
```

### Problem: API-Sports.io rate limit

**Check your usage:**
```bash
# View logs
docker-compose logs calendar-service | grep "API-Sports"

# API-Sports.io has 100 calls/day per sport
# Service uses ~20-30 calls/day with smart caching
```

---

## 📈 Monitoring

### View Logs
```bash
# Real-time logs
docker-compose logs -f calendar-service

# Last 100 lines
docker-compose logs --tail=100 calendar-service

# Filter for errors
docker-compose logs calendar-service | grep ERROR
```

### Check Workflows (Temporal UI)
1. Open http://localhost:8080
2. Click "Workflows"
3. Look for: `fixture-sync-daily-*`

### Database Check
```bash
# Connect to PostgreSQL
docker exec -it calendar-postgres psql -U postgres -d topplayersofallsports

# Count fixtures
SELECT COUNT(*) FROM fixtures;

# View recent fixtures
SELECT id, league_name, home_team_name, away_team_name, fixture_date, status 
FROM fixtures 
ORDER BY fixture_date DESC 
LIMIT 10;

# Exit
\q
```

---

## 🧪 Testing the System

### 1. End-to-End Test

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait for startup (30 seconds)
sleep 30

# 3. Check health
curl http://localhost:8083/api/calendar/health

# 4. Trigger sync
curl -X POST http://localhost:8083/api/calendar/admin/sync

# 5. Get fixtures
curl http://localhost:8083/api/calendar/fixtures

# 6. Get top 3 matches
curl http://localhost:8083/api/calendar/fixtures/top3

# 7. Check database
docker exec -it calendar-postgres psql -U postgres -d topplayersofallsports -c "SELECT COUNT(*) FROM fixtures;"
```

### 2. Performance Test

```bash
# Test caching (should be fast on 2nd call)
time curl http://localhost:8083/api/calendar/fixtures
time curl http://localhost:8083/api/calendar/fixtures
```

---

## 🔄 Daily Operations

### Start Infrastructure
```bash
cd services/calendar-service
docker-compose up -d
```

### Start Service (in a new terminal)
```bash
cd services/calendar-service
mvn spring-boot:run
```

### Stop System
```bash
# Stop service: Ctrl+C in the Maven terminal

# Stop infrastructure
docker-compose down
```

### View Status
```bash
# Infrastructure status
docker-compose ps

# Service logs
# Check the terminal where mvn spring-boot:run is running
```

### Update Service
```bash
# Rebuild
mvn clean package -DskipTests

# Restart: Ctrl+C then run again
mvn spring-boot:run
```

---

## 📝 Next Steps

1. ✅ **Service is running** on http://localhost:8083
2. ✅ **Swagger UI** available at http://localhost:8083/swagger-ui.html
3. ✅ **Frontend integrated** - calendar page will use this backend
4. ⏭️ **Test in browser**: Open calendar page and see top 3 matches
5. ⏭️ **Monitor workflows**: Check Temporal UI at http://localhost:8080
6. ⏭️ **Production deployment**: Follow README.md deployment section

---

## 🆘 Need Help?

### Check Logs
```bash
# Service logs
docker-compose logs calendar-service

# Temporal logs
docker-compose logs temporal

# All logs
docker-compose logs
```

### Common Issues

| Issue | Command | Expected Result |
|-------|---------|-----------------|
| Service not starting | `docker-compose up -d` | All services "Up" |
| No data | `curl -X POST http://localhost:8083/api/calendar/admin/sync` | "Sync completed" |
| Port conflict | `docker-compose down` then `docker-compose up -d` | Services restart |
| Database empty | Check API key in docker-compose.yml | Valid API key |

---

**🎉 You're all set! The calendar service is now production-ready!**

Access the APIs at: http://localhost:8083/api/calendar/fixtures
