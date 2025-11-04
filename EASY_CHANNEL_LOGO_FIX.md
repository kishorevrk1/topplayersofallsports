# 🎨 Easy Channel Logo Fix - REST API Method

## ✅ **Simple 3-Step Process:**

I've created REST API endpoints to make this super easy!

---

## 🚀 **Steps:**

### **Step 1: Restart Backend**
```powershell
# Stop current backend (Ctrl+C)
# Then restart:
cd services/highlights-service
mvn spring-boot:run '-Dspring-boot.run.profiles=local'
```

Wait for: `Started HighlightsApplication`

---

### **Step 2: Add Channel IDs (NEW!)**
```powershell
Invoke-WebRequest -Uri http://localhost:8081/api/admin/add-channel-ids -Method POST
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Channel IDs added successfully. Updated 11 sources.",
  "updated": "11"
}
```

This populates the `channel_id` column for all 11 sources!

---

### **Step 3: Run Backfill Again**
```powershell
Invoke-WebRequest -Uri http://localhost:8081/api/admin/backfill-channel-info -Method POST
```

**Expected Response:**
```json
{
  "status": "started",
  "message": "Channel info backfill started. Check logs for progress."
}
```

---

### **Step 4: Wait 30 Seconds**

Watch backend logs for:
```
INFO - Fetched channel info - Name: NBA, Thumbnail: Yes
INFO - Updated 365 highlights with channel info for source ID: 3
INFO - Channel info backfill completed. Updated: 1726, Failed: 0
```

---

### **Step 5: Verify**
```powershell
curl 'http://localhost:8081/api/highlights/1761' | ConvertFrom-Json | Select-Object @{Name='channel';Expression={$_.source.name}}, @{Name='logo';Expression={$_.source.logo}}
```

**Expected:**
```
channel  logo
-------  ----
NBA      https://yt3.ggpht.com/...
```

---

### **Step 6: Refresh Browser**
```
Ctrl+F5
```

**Channel logos should now be visible!** 🎨

---

## 📋 **What Each Endpoint Does:**

### **1. `/api/admin/add-channel-ids`**
- Adds YouTube channel IDs to `highlight_sources` table
- Updates 11 sources with their channel IDs
- One-time operation
- **No YouTube API calls** (uses hardcoded IDs)

### **2. `/api/admin/backfill-channel-info`**
- Fetches channel info from YouTube API
- Gets channel names and thumbnail URLs
- Updates all 1,726 highlights
- **Uses 11 YouTube API quota units**

---

## ✨ **Benefits of REST API Method:**

✅ **No SQL needed** - Just HTTP requests
✅ **No psql required** - Works from anywhere
✅ **Easy to run** - Simple PowerShell commands
✅ **Logged** - See progress in backend logs
✅ **Safe** - Transactional, can't break anything

---

## 🎯 **Quick Copy-Paste:**

```powershell
# 1. Restart backend
cd services/highlights-service
mvn spring-boot:run '-Dspring-boot.run.profiles=local'

# 2. Wait for startup, then add channel IDs
Invoke-WebRequest -Uri http://localhost:8081/api/admin/add-channel-ids -Method POST

# 3. Run backfill
Invoke-WebRequest -Uri http://localhost:8081/api/admin/backfill-channel-info -Method POST

# 4. Wait 30 seconds

# 5. Refresh browser (Ctrl+F5)
```

---

**That's it! Channel logos will be fixed! 🎉**
