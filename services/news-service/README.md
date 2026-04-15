# 📰 Sports News Service

A production-ready microservice for aggregating and serving sports news from NewsAPI.org.

## 🎯 Features

- ✅ **Real-time sports news** from NewsAPI.org
- ✅ **20 articles per sport** (Basketball, Football, Soccer, Hockey, Tennis, MMA, Baseball, Golf)
- ✅ **Auto-updates every 6 hours** via Temporal workflows
- ✅ **PostgreSQL storage** for persistence
- ✅ **Redis caching** for performance
- ✅ **RESTful API** with Swagger documentation
- ✅ **Search & filtering** by sport, keyword, tags
- ✅ **Breaking news** detection
- ✅ **Trending articles** (most viewed)
- ✅ **View count tracking**

---

## 🏗️ Architecture

```
news-service/
├── domain/model/          # Entities (NewsArticle, Sport)
├── repository/            # JPA repositories
├── service/               # Business logic
├── api/                   # REST controllers
├── infrastructure/        # External integrations (NewsAPI)
├── temporal/              # Workflows & activities
└── config/                # Spring configuration
```

---

## 🚀 Quick Start

### **Prerequisites:**

- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- Redis 6+
- Temporal Server (optional, for auto-updates)

### **1. Start Dependencies:**

```bash
# PostgreSQL (same database as highlights-service)
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5433:5432 \
  postgres:14

# Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:6

# Temporal (optional)
docker run -d \
  --name temporal \
  -p 7233:7233 \
  temporalio/auto-setup:latest
```

### **2. Configure:**

Edit `src/main/resources/application.yml`:

```yaml
newsapi:
  api-key: NEWSAPI_KEY_REMOVED  # Your API key
  articles-per-sport: 20
```

### **3. Run:**

```bash
cd services/news-service
mvn spring-boot:run
```

Service starts on: **http://localhost:8082**

---

## 📡 API Endpoints

### **Base URL:** `http://localhost:8082/api/news`

### **Get All News:**
```
GET /api/news?page=0&size=20
```

### **Get News by Sport:**
```
GET /api/news/sport/BASKETBALL?page=0&size=20
```

**Sports:** `BASKETBALL`, `FOOTBALL`, `SOCCER`, `HOCKEY`, `TENNIS`, `MMA`, `BASEBALL`, `GOLF`

### **Get Breaking News:**
```
GET /api/news/breaking?sport=BASKETBALL&page=0&size=10
```

### **Get Trending News:**
```
GET /api/news/trending?sport=SOCCER&page=0&size=10
```

### **Search News:**
```
GET /api/news/search?q=LeBron&sport=BASKETBALL&page=0&size=20
```

### **Get News by Tag:**
```
GET /api/news/tag/Lakers?page=0&size=20
```

### **Get Article by ID:**
```
GET /api/news/123
```

### **Get Recent Articles (Last 24h):**
```
GET /api/news/recent?sport=FOOTBALL
```

### **Get Statistics:**
```
GET /api/news/stats
```

### **Manual Fetch (Admin):**
```
POST /api/news/admin/fetch?sport=BASKETBALL
POST /api/news/admin/fetch  # Fetch all sports
```

---

## 📊 Response Example

```json
{
  "content": [
    {
      "id": 1,
      "title": "LeBron James Scores 40 Points in Lakers Victory",
      "description": "LeBron James led the Lakers to a crucial win...",
      "content": "Full article content...",
      "url": "https://espn.com/nba/story/...",
      "imageUrl": "https://cdn.espn.com/...",
      "sourceName": "ESPN",
      "author": "John Smith",
      "sport": "BASKETBALL",
      "tags": ["LeBron James", "Lakers", "NBA"],
      "publishedAt": "2025-11-06T10:30:00Z",
      "viewCount": 1250,
      "isBreaking": true,
      "isActive": true
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 160,
  "totalPages": 8
}
```

---

## 🔄 Auto-Update Schedule

News is automatically fetched every **6 hours** via Temporal workflow:

- **Cron:** `0 0 */6 * * *` (00:00, 06:00, 12:00, 18:00)
- **Sports:** All configured sports
- **Articles per sport:** 20
- **Total API calls:** ~8 per update cycle

### **NewsAPI Free Tier:**
- **100 requests/day** limit
- **4 update cycles/day** = 32 requests/day
- **Well within limit!** ✅

---

## 🗄️ Database Schema

### **news_articles table:**

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| title | VARCHAR(500) | Article title |
| description | TEXT | Short description |
| content | TEXT | Full content |
| url | VARCHAR(1000) | Original article URL (unique) |
| image_url | VARCHAR(1000) | Thumbnail image |
| source_name | VARCHAR(100) | Source (ESPN, etc.) |
| author | VARCHAR(200) | Article author |
| sport | VARCHAR(50) | Sport category |
| published_at | TIMESTAMP | Publication date |
| fetched_at | TIMESTAMP | When we fetched it |
| view_count | INTEGER | Number of views |
| is_breaking | BOOLEAN | Breaking news flag |
| is_active | BOOLEAN | Active/archived |

### **news_article_tags table:**

| Column | Type | Description |
|--------|------|-------------|
| article_id | BIGINT | Foreign key |
| tag | VARCHAR(100) | Tag name |

---

## 🎯 NewsAPI Integration

### **How It Works:**

1. **Query Construction:** Sport-specific queries for better results
   ```
   BASKETBALL: "NBA OR basketball OR LeBron James OR Stephen Curry"
   FOOTBALL: "NFL OR American football OR Tom Brady"
   SOCCER: "Premier League OR Champions League OR Messi"
   ```

2. **API Call:** Fetch 20 most recent articles per sport
   ```
   GET https://newsapi.org/v2/everything?
     q=NBA OR basketball&
     language=en&
     sortBy=publishedAt&
     pageSize=20&
     apiKey=YOUR_KEY
   ```

3. **Parsing:** Extract title, description, image, source, etc.

4. **Deduplication:** Check if URL already exists in database

5. **Storage:** Save new articles to PostgreSQL

6. **Caching:** Cache results in Redis for fast access

---

## 📈 Performance

### **Caching Strategy:**

- **News lists:** Cached for 1 hour
- **Breaking news:** Cached for 5 minutes
- **Trending news:** Cached for 15 minutes
- **Individual articles:** Not cached (view count tracking)

### **Database Indexes:**

- `idx_sport` - Fast filtering by sport
- `idx_published_at` - Fast sorting by date
- `idx_sport_published` - Combined index for sport + date queries
- `idx_is_active` - Fast filtering of active articles

---

## 🔧 Configuration

### **application.yml:**

```yaml
# NewsAPI
newsapi:
  api-key: YOUR_KEY_HERE
  base-url: https://newsapi.org/v2
  articles-per-sport: 20
  update-interval-hours: 6

# Database
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/topplayersofallsports
    username: postgres
    password: postgres

# Redis Cache
spring:
  data:
    redis:
      host: localhost
      port: 6379

# Temporal
temporal:
  host: localhost
  port: 7233
  namespace: default
  task-queue: news-task-queue

# Auto-update schedule
news:
  ingest:
    enabled: true
    cron: "0 0 */6 * * *"  # Every 6 hours
    sports:
      - BASKETBALL
      - FOOTBALL
      - SOCCER
      - HOCKEY
      - TENNIS
      - MMA
      - BASEBALL
      - GOLF
```

---

## 🧪 Testing

### **Manual Fetch:**

```bash
# Fetch news for specific sport
curl -X POST http://localhost:8082/api/news/admin/fetch?sport=BASKETBALL

# Fetch all sports
curl -X POST http://localhost:8082/api/news/admin/fetch
```

### **Check Stats:**

```bash
curl http://localhost:8082/api/news/stats
```

### **Get Recent Articles:**

```bash
curl http://localhost:8082/api/news/recent?sport=BASKETBALL
```

---

## 📚 Swagger Documentation

Access interactive API documentation:

**URL:** http://localhost:8082/swagger-ui.html

---

## 🚨 Monitoring

### **Health Check:**

```bash
curl http://localhost:8082/actuator/health
```

### **Metrics:**

```bash
curl http://localhost:8082/actuator/metrics
```

### **Logs:**

```bash
tail -f logs/news-service.log
```

---

## 🔐 Security

### **API Key:**

- Store in environment variable (production)
- Never commit to Git
- Rotate periodically

### **CORS:**

- Currently allows all origins (`*`)
- Restrict in production to your frontend domain

---

## 🎯 Future Enhancements

- [ ] Player-specific news (link to player profiles)
- [ ] Team-specific news
- [ ] Sentiment analysis
- [ ] News categories (trades, injuries, awards)
- [ ] Email notifications for breaking news
- [ ] RSS feed export
- [ ] News recommendations based on user preferences

---

## 📝 License

MIT License

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Contact: support@topplayersofallsports.com

---

**Built with ❤️ for sports fans worldwide! 🏀⚽🏈🏒🎾**
