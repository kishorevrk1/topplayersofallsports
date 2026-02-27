# 🎯 Live-First Strategy - Calendar Service

## Overview
The Calendar Service is optimized for the **API-Sports.io Free Plan** (100 requests/day) using a **Live-First experience** that focuses on real-time match updates.

---

## 📊 API Plan Constraints

### Free Plan Limits:
- **100 API calls per day**
- **Live matches only** (historical data requires premium)
- **3-day window** for date-specific queries (2025-11-22 to 2025-11-24)
- **Rate limit:** 10 requests/minute

### What Works:
✅ Live matches: `/fixtures?live=all` or `/fixtures?live=39-140-1-2`  
✅ Batched league queries: Single call for all 4 leagues  
✅ Real-time score updates  

### What Doesn't Work (Free Plan):
❌ Historical match data  
❌ Future schedule beyond 3-day window  
❌ Season-specific queries for current season (2024-2025)  
❌ Detailed player statistics  

---

## 🎨 User Experience

### What Users Get:

#### 1. **Live Matches** (Auto-updating every 15s)
- Real-time scores
- Match time/status
- Current league context
- Live badge indicator

#### 2. **Today's Schedule**
- All matches happening today
- Kick-off times (user timezone)
- League badges, team logos

#### 3. **Match Details**
- Final/live scores
- Venue, referee
- Team information

### What Users DON'T Get (Free Tier):
- Match archives
- Future matches beyond today
- Historical head-to-head
- Advanced player stats

---

## 🔄 API Usage Strategy

### Daily Budget Allocation:
```
Live Updates:       60 calls (15s interval, 6 AM - 12 AM)
Manual Refreshes:   30 calls (buffer for user actions)
Admin Operations:   10 calls (health checks, manual syncs)
─────────────────────────────────────────────────────
Total:             100 calls/day ✅
```

### Optimization Techniques:

1. **Batch League Queries**
   - Single call: `/fixtures?live=39-140-1-2`
   - Fetches all 4 leagues at once
   - Saves 3 API calls per update

2. **Redis Caching**
   - Cache live data for 15 seconds
   - Reduce duplicate API calls
   - Fast response times

3. **Smart Scheduling**
   - Only update during peak hours (6 AM - 12 AM)
   - Pause when no live matches
   - Skip off-hours (12 AM - 6 AM)

4. **Disabled Features**
   - Daily 7-day sync (DISABLED)
   - Historical data sync (DISABLED)
   - Initial startup sync (DISABLED)

---

## 📁 Code Changes

### Modified Files:

#### `application.yml`
```yaml
# Free Plan Strategy: Live-First Experience
api-sports:
  rate-limit:
    requests-per-day: 100
  leagues:
    - id: 39  # Premier League
    - id: 140 # La Liga
    - id: 1   # World Cup
    - id: 2   # Champions League
```

#### `FixtureSyncScheduler.java`
- ✅ Live updates: Every 15 seconds (ACTIVE)
- ❌ Daily sync: Disabled for free plan
- ❌ Initial sync: Disabled to conserve API calls

#### `FixtureService.java`
- `updateLiveFixtures()`: Batches all leagues in 1 call
- Caches results in Redis (15s TTL)
- Auto-marks matches as not live when finished

---

## 🚀 Deployment Guide

### Environment Variables:
```bash
API_SPORTS_KEY=APISPORTS_KEY_REMOVED
DB_NAME=calendar_service
DB_PORT=5433
REDIS_PORT=6379
SERVER_PORT=8083
```

### Start Services:
```bash
# 1. Start infrastructure (PostgreSQL, Redis, Temporal)
docker-compose up -d

# 2. Start Calendar Service
cd services/calendar-service
mvn spring-boot:run
```

### Verify Live Updates:
```bash
# Check live fixtures
curl http://localhost:8083/api/calendar/fixtures/live

# Check database
docker exec highlights-postgres psql -U postgres -d calendar_service \
  -c "SELECT COUNT(*) FROM fixtures WHERE is_live = true;"
```

---

## 📈 Future: Premium Features

When we upgrade to a paid API plan or get revenue:

### Premium Tier ($4.99/month):
- ✅ Full season history (2021-current)
- ✅ Future schedule (next 30 days)
- ✅ Advanced match statistics
- ✅ Player-level data
- ✅ Custom notifications
- ✅ 10+ leagues (expand beyond top 4)
- ✅ Match highlights integration

### Premium Implementation:
1. Uncomment `@Scheduled` in `FixtureSyncScheduler.scheduleDailySync()`
2. Update `application.yml` with new API key
3. Enable historical endpoints in `FixtureController`
4. Add subscription/payment gateway

---

## 📊 Monitoring

### Key Metrics to Track:

1. **API Usage**
   - Daily call count (target: <95 calls/day)
   - Peak hour usage
   - Error rate

2. **User Engagement**
   - Live matches viewed
   - Average session duration
   - Refresh rate

3. **Performance**
   - Redis cache hit rate (target: >80%)
   - API response time
   - Database query performance

### Alerts:
- ⚠️ API usage > 90 calls/day
- 🔴 API rate limit exceeded
- ⚠️ No live matches for >2 hours (during peak)

---

## 🎯 Success Metrics

### MVP Goals (3 months):
- 1,000+ active users
- <95 API calls/day average
- <500ms average response time
- >80% cache hit rate
- Zero API limit violations

### Premium Conversion Target:
- 100 paying users = $499/month
- Covers API upgrade ($49/month) + hosting
- Profit: ~$450/month

---

## 🛠️ Development

### Testing Locally:
```bash
# Test API key
curl -H "x-apisports-key: APISPORTS_KEY_REMOVED" \
  "https://v3.football.api-sports.io/fixtures?live=all"

# Check live fixtures in service
curl http://localhost:8083/api/calendar/fixtures/live

# Manual trigger (dev only)
curl -X POST http://localhost:8083/api/calendar/admin/sync/live
```

### Troubleshooting:
- **No live matches?** Check if it's peak hours (6 AM - 12 AM)
- **API errors?** Verify API key in `application.yml`
- **Empty database?** Wait 15 seconds for first live update
- **High API usage?** Check logs for failed retries

---

## 📝 Notes

- Free plan = **Live matches only**
- Premium features = **Commented out** (easy to enable)
- Database schema = **Ready for all sports** (basketball, hockey, etc.)
- Frontend = **Needs updates** to match Live-First UX

---

**Last Updated:** Nov 25, 2025  
**Strategy:** Live-First MVP → Premium Features Later  
**Goal:** Build audience → Monetize → Upgrade API plan
