# 🚀 News Service - Setup Guide

## ✅ **What's Been Created:**

A complete, production-ready sports news microservice using **NewsAPI.org** and the official **News-API-Java** library!

---

## 📦 **What You Have:**

### **1. Complete Spring Boot Application**
- ✅ Entity: `NewsArticle` (stores news in PostgreSQL)
- ✅ Repository: Full CRUD + search/filter queries
- ✅ Service: Business logic with caching
- ✅ Controller: REST API with 10+ endpoints
- ✅ NewsAPI Client: Using official library
- ✅ Temporal Workflow: Auto-updates every 6 hours
- ✅ Configuration: All settings in `application.yml`

### **2. Key Features:**
- ✅ Fetches 20 articles per sport
- ✅ 8 sports supported (Basketball, Football, Soccer, Hockey, Tennis, MMA, Baseball, Golf)
- ✅ Auto-deduplication (won't save same article twice)
- ✅ Breaking news detection (articles < 1 hour old)
- ✅ View count tracking
- ✅ Tag extraction (players, teams, sources)
- ✅ Redis caching for performance
- ✅ Swagger API documentation

---

## 🎯 **Next Steps:**

### **Step 1: Download Dependencies**

```powershell
cd services/news-service
mvn clean install
```

This will:
- Download News-API-Java library from JitPack
- Download all Spring Boot dependencies
- Compile the project

### **Step 2: Start Dependencies**

```powershell
# PostgreSQL (if not already running)
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:14

# Redis (if not already running)
docker run -d --name redis -p 6379:6379 redis:6

# Temporal (optional - for auto-updates)
docker run -d --name temporal -p 7233:7233 temporalio/auto-setup:latest
```

### **Step 3: Start News Service**

```powershell
# Option A: Using Maven
mvn spring-boot:run

# Option B: Using the start script
.\start.ps1
```

Service will start on: **http://localhost:8082**

### **Step 4: Test It!**

```powershell
# Manually fetch news for Basketball
Invoke-WebRequest -Uri http://localhost:8082/api/news/admin/fetch?sport=BASKETBALL -Method POST

# Get all news
curl http://localhost:8082/api/news

# Get Basketball news
curl http://localhost:8082/api/news/sport/BASKETBALL

# Get breaking news
curl http://localhost:8082/api/news/breaking

# Search news
curl "http://localhost:8082/api/news/search?q=LeBron"
```

---

## 📊 **API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/news` | GET | Get all news (paginated) |
| `/api/news/sport/{sport}` | GET | Get news by sport |
| `/api/news/breaking` | GET | Get breaking news |
| `/api/news/trending` | GET | Get trending (most viewed) |
| `/api/news/search?q={keyword}` | GET | Search news |
| `/api/news/tag/{tag}` | GET | Get news by tag |
| `/api/news/{id}` | GET | Get specific article |
| `/api/news/recent` | GET | Get last 24h articles |
| `/api/news/stats` | GET | Get statistics |
| `/api/news/admin/fetch` | POST | Manual fetch (admin) |

---

## 🔄 **Auto-Update Schedule:**

News automatically fetches every **6 hours**:
- **00:00** - Midnight update
- **06:00** - Morning update
- **12:00** - Noon update
- **18:00** - Evening update

**Total API calls:** ~32/day (well within 100/day free limit!)

---

## 🎯 **Your API Key:**

Already configured in `application.yml`:
```yaml
newsapi:
  api-key: ab34ae67855f4986a707bd9dea463055
  articles-per-sport: 20
```

---

## 📱 **Connect Frontend:**

Update your React frontend to call:
```javascript
// Get all news
const response = await fetch('http://localhost:8082/api/news');
const data = await response.json();

// Get Basketball news
const response = await fetch('http://localhost:8082/api/news/sport/BASKETBALL');

// Search
const response = await fetch('http://localhost:8082/api/news/search?q=LeBron');
```

---

## 🗄️ **Database:**

News is stored in the same PostgreSQL database as highlights:
- Database: `topplayersofallsports`
- Table: `news_articles`
- Tags table: `news_article_tags`

---

## 🎨 **Swagger UI:**

Interactive API documentation:
**http://localhost:8082/swagger-ui.html**

---

## 📈 **Expected Results:**

After first fetch:
- **Basketball:** ~20 articles
- **Football:** ~20 articles
- **Soccer:** ~20 articles
- **Hockey:** ~20 articles
- **Tennis:** ~20 articles
- **MMA:** ~20 articles
- **Baseball:** ~20 articles
- **Golf:** ~20 articles

**Total:** ~160 articles initially

---

## 🔧 **Troubleshooting:**

### **Issue: Maven can't download News-API-Java**

**Solution:**
```powershell
# Clear Maven cache
mvn dependency:purge-local-repository

# Try again
mvn clean install
```

### **Issue: Database connection error**

**Solution:**
```powershell
# Check if PostgreSQL is running
docker ps | findstr postgres

# If not, start it
docker start postgres
```

### **Issue: Redis connection error**

**Solution:**
```powershell
# Check if Redis is running
docker ps | findstr redis

# If not, start it
docker start redis
```

---

## ✅ **Verification Checklist:**

- [ ] Maven dependencies downloaded
- [ ] PostgreSQL running on port 5433
- [ ] Redis running on port 6379
- [ ] News service starts without errors
- [ ] Can access http://localhost:8082/actuator/health
- [ ] Can manually fetch news
- [ ] News appears in database
- [ ] Can query news via API
- [ ] Swagger UI accessible

---

## 🎉 **Success!**

When everything works, you'll have:
- ✅ Real sports news from NewsAPI
- ✅ Auto-updates every 6 hours
- ✅ Full REST API
- ✅ Cached for performance
- ✅ Production-ready code

---

## 📞 **Need Help?**

Check the logs:
```powershell
# In the terminal where you ran mvn spring-boot:run
# Look for errors or warnings
```

---

**You're all set! Start the service and fetch some news! 🚀📰**
