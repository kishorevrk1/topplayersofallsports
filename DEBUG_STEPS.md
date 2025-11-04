# 🔍 Debug Steps - API Works But UI Shows Error

## ✅ **What We Know:**

1. **API is working** - Returns 200 OK
2. **Data is correct** - 1,717 videos in database
3. **URL is correct** - No more trailing slash
4. **UI shows error** - "Network Error" message

---

## 🐛 **Step-by-Step Debugging**

### **Step 1: Open Browser Console**

1. Open your browser (http://localhost:3000)
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for errors (red text)

### **What to Look For:**

```javascript
// Should see (if debug logging is on):
🎬 Highlights API Request: GET ...
✅ Highlights API Response: ...

// Or errors like:
❌ Highlights API Error: {...}
Error fetching highlights: ...
```

---

### **Step 2: Check Network Tab**

1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for `/api/highlights` request
4. Click on it to see details

### **Check:**

- **Status:** Should be `200 OK` ✅
- **Response:** Should have JSON with `content` array
- **Preview:** Should show video objects

---

### **Step 3: Check React DevTools (if installed)**

1. Install React DevTools extension
2. Open Components tab
3. Find `VideoHighlightsHub` component
4. Check state:
   - `highlights` - should be array with videos
   - `isLoading` - should be false
   - `error` - should be null

---

## 🔧 **Common Issues & Fixes**

### **Issue 1: CORS Error**

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:8081/api/highlights' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Fix:**
Add to `services/highlights-service/src/main/resources/application.yml`:
```yaml
spring:
  web:
    cors:
      allowed-origins: "http://localhost:3000"
      allowed-methods: "*"
      allowed-headers: "*"
```

Then restart backend.

---

### **Issue 2: Data Transform Error**

**Symptoms:**
```
TypeError: Cannot read property 'map' of undefined
```

**Fix:**
The transform function might be failing. Check console for exact error.

---

### **Issue 3: Hook Not Updating**

**Symptoms:**
- API returns data
- No errors in console
- UI still shows "No videos"

**Fix:**
Check if `highlights` state is being set. Add temporary logging:

```javascript
// In useHighlights hook
console.log('Highlights fetched:', transformed.content.length);
```

---

## 📝 **Quick Test**

Add this temporarily to your page component to see raw data:

```javascript
// In VideoHighlightsHub component, after useHighlights hook
useEffect(() => {
  console.log('=== DEBUG ===');
  console.log('Highlights:', highlights);
  console.log('Is Loading:', isLoading);
  console.log('Error:', error);
  console.log('Has More:', hasMore);
}, [highlights, isLoading, error, hasMore]);
```

This will log the state every time it changes.

---

## 🎯 **Next Steps**

1. **Open browser console** and share what errors you see
2. **Check Network tab** - is the request actually being made?
3. **Look for red errors** in console

**Share the console output and I'll help fix it! 🚀**
