# 🎨 Channel Logo Backfill - Step by Step Guide

## 🔍 **Current Status:**
- ✅ Backfill service created (`ChannelInfoBackfillService.java`)
- ✅ Admin endpoint created (`/api/admin/backfill-channel-info`)
- ✅ Repository method added (`updateChannelInfoBySourceId`)
- ✅ Redis serialization fixed (`CacheConfig.java` with JavaTimeModule)
- ⏳ **Need to restart backend and run backfill**

---

## 🚀 **Steps to Fix Channel Logos:**

### **Step 1: Stop Current Backend**
```powershell
# Press Ctrl+C in the terminal running the backend
# Or kill the process
```

### **Step 2: Restart Backend with Fixes**
```powershell
cd services/highlights-service
mvn spring-boot:run '-Dspring-boot.run.profiles=local'
```

**Wait for:**
```
Started HighlightsApplication in X seconds
```

### **Step 3: Trigger Channel Info Backfill**
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

### **Step 4: Monitor Backend Logs**
Look for these log messages:
```
INFO  - Starting channel info backfill for all highlights
INFO  - Found 11 active sources to process
INFO  - Fetched channel info - Name: NBA, Thumbnail: Yes
INFO  - Updated 156 highlights with channel info for source ID: 3
INFO  - Channel info backfill completed. Updated: 1717, Failed: 0
```

### **Step 5: Verify Channel Logos**
```powershell
# Wait 30 seconds after backfill completes, then:
curl 'http://localhost:8081/api/highlights?size=3' | ConvertFrom-Json | Select-Object -ExpandProperty content | Select-Object id, @{Name='channel';Expression={$_.source.name}}, @{Name='hasLogo';Expression={$_.source.logo -ne $null}}
```

**Expected Output:**
```
id   channel    hasLogo
--   -------    -------
1761 ESPN NFL   True
1760 NBA        True
1759 NBA        True
```

### **Step 6: Refresh Frontend**
```
Press Ctrl+F5 in browser
```

**Channel logos should now be visible!** 🎨

---

## 🔧 **What the Backfill Does:**

1. **Fetches all active sources** (11 sources: NBA, UFC, NFL, etc.)
2. **For each source:**
   - Gets channel ID from database
   - Calls YouTube API to get channel info
   - Extracts channel name and thumbnail URL
   - Updates all highlights from that source
3. **Logs progress** for each source
4. **Reports completion** with total count

---

## 💰 **YouTube API Quota Cost:**

- **One-time cost:** 11 quota units (1 per source)
- **Daily quota:** 10,000 units
- **Impact:** 0.11% of daily quota
- **Very cheap!** ✅

---

## 📊 **Expected Results:**

### **Database Updates:**
```sql
-- Before:
channel_name: NULL
channel_thumbnail: NULL

-- After:
channel_name: 'NBA'
channel_thumbnail: 'https://yt3.ggpht.com/...'
```

### **API Response:**
```json
{
  "source": {
    "name": "NBA",
    "logo": "https://yt3.ggpht.com/ytc/...",
    "platform": "YOUTUBE"
  }
}
```

### **Frontend:**
- Channel logos visible in video cards
- Channel logos visible in player
- Channel logos visible in sidebar

---

## 🐛 **Troubleshooting:**

### **If backfill fails:**

1. **Check backend logs** for errors
2. **Verify Redis is running:**
   ```powershell
   redis-cli ping
   # Should return: PONG
   ```

3. **Check YouTube API key:**
   ```yaml
   # application-local.yml
   youtube:
     api-key: YOUR_KEY_HERE
   ```

4. **Verify sources have channel IDs:**
   ```sql
   SELECT id, name, channel_id FROM highlight_sources WHERE active = true;
   ```

### **If logos still not showing:**

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Check API response:**
   ```powershell
   curl 'http://localhost:8081/api/highlights/1761'
   ```
4. **Verify source.logo is not null**

---

## 📝 **Quick Command Reference:**

```powershell
# 1. Restart backend
cd services/highlights-service
mvn spring-boot:run '-Dspring-boot.run.profiles=local'

# 2. Wait for startup, then trigger backfill
Invoke-WebRequest -Uri http://localhost:8081/api/admin/backfill-channel-info -Method POST

# 3. Wait 30 seconds, then verify
curl 'http://localhost:8081/api/highlights?size=3'

# 4. Refresh browser
# Press Ctrl+F5
```

---

## ✅ **Success Criteria:**

- ✅ Backend starts without errors
- ✅ Backfill completes successfully
- ✅ Logs show "Updated: 1717"
- ✅ API returns channel names and logos
- ✅ Frontend displays channel logos
- ✅ No errors in browser console

---

**Follow these steps and channel logos will be fixed! 🎨**
