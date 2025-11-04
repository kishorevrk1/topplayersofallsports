# 🔧 Trending 500 Error - Quick Fix

## ❌ **Error:**
```
GET http://localhost:8081/api/highlights/trending?limit=10 500 (Internal Server Error)
```

## 🔍 **Root Cause:**

The `/trending` endpoint has `@Cacheable` annotation which tries to cache results to Redis. The Redis serialization is failing because of the `java.time.Instant` issue we fixed earlier in `CacheConfig.java`.

**The backend needs to be restarted** to load the fixed configuration.

---

## ✅ **Solution:**

### **Restart Backend with Fixed Config**

The fix is already in place (`CacheConfig.java` with `JavaTimeModule`), but the backend is still running with the old configuration.

---

## 🚀 **Steps to Fix:**

### **1. Stop Current Backend**
```powershell
# Press Ctrl+C in the terminal running the backend
```

### **2. Restart Backend**
```powershell
cd services/highlights-service
mvn spring-boot:run '-Dspring-boot.run.profiles=local'
```

### **3. Wait for Startup**
Look for:
```
Started HighlightsApplication in X seconds
```

### **4. Refresh Frontend**
```
Ctrl+F5 in browser
```

---

## 📋 **What Was Already Fixed:**

In `CacheConfig.java`, we added:

```java
// Configure ObjectMapper with Java 8 date/time module
ObjectMapper objectMapper = new ObjectMapper();
objectMapper.registerModule(new JavaTimeModule());
objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

// Use this ObjectMapper for Redis serialization
new GenericJackson2JsonRedisSerializer(objectMapper)
```

This allows Redis to serialize `java.time.Instant` fields properly.

---

## 🎯 **After Restart:**

✅ Trending endpoint will work
✅ Redis caching will work
✅ No more 500 errors
✅ Trending sidebar will load data
✅ All cached endpoints will work

---

## 🔍 **Verify It's Working:**

### **Check API:**
```powershell
curl http://localhost:8081/api/highlights/trending?limit=10
```

**Expected:** 200 OK with JSON array of videos

### **Check Frontend:**
1. Widen browser to 1024px+
2. See trending sidebar on right
3. Should show 10 trending videos
4. No errors in console

---

## 📊 **Affected Endpoints:**

All these endpoints use caching and will benefit from the fix:

- ✅ `/api/highlights/trending` - Trending videos
- ✅ `/api/highlights/featured` - Featured videos  
- ✅ `/api/highlights` - Regular highlights (with filters)
- ✅ `/api/highlights/{id}` - Single highlight

---

## 💡 **Why This Happened:**

1. We fixed `CacheConfig.java` earlier
2. But backend was still running with old config
3. Old config doesn't have `JavaTimeModule`
4. Redis can't serialize `Instant` fields
5. Caching fails → 500 error

**Solution:** Restart backend to load new config

---

## ⚡ **Quick Command:**

```powershell
# Stop backend (Ctrl+C), then:
cd services/highlights-service
mvn spring-boot:run '-Dspring-boot.run.profiles=local'
```

---

**Restart the backend and the trending sidebar will work! 🎉**
