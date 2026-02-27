# 🚀 Quick Start - Live Sports Calendar

## ✅ What's Been Built

### **Backend (Spring Boot):**
- ✅ Live match API endpoint (`/api/calendar/fixtures/live`)
- ✅ Auto-sync every 15 seconds
- ✅ PostgreSQL database (`calendar_service`)
- ✅ Redis caching (15s TTL)
- ✅ Liquibase migrations
- ✅ Multi-sport schema

### **Frontend (React + Tailwind):**
- ✅ LiveMatchCard component
- ✅ LiveCalendar component  
- ✅ SportsCalendarPageNew component
- ✅ Auto-refresh every 15s
- ✅ Beautiful animations
- ✅ Mobile-responsive

---

## 🎯 Quick Start (5 Minutes)

### **Step 1: Start Backend Services**
```bash
# Terminal 1 - Start Docker (PostgreSQL, Redis, Temporal)
docker-compose up -d

# Terminal 2 - Start Calendar Service
cd services/calendar-service
mvn spring-boot:run

# Wait for: "Started CalendarServiceApplication"
```

### **Step 2: Verify Backend**
```powershell
# Check live matches endpoint
Invoke-WebRequest -Uri "http://localhost:8083/api/calendar/fixtures/live" | ConvertFrom-Json

# Should return JSON with live matches (if any are happening)
```

### **Step 3: Start Frontend**
```bash
# Terminal 3 - Start React app
npm run dev

# Should open: http://localhost:5173
```

### **Step 4: View Live Calendar**
```
Navigate to: http://localhost:5173/sports-calendar
```

---

## 🎨 Using the New Components

### **Option 1: Replace Old Page (Recommended)**

**File:** `src/pages/sports-calendar/SportsCalendarPage.jsx`

**Action:** Backup old file, then replace with new content:

```bash
# Backup
mv src/pages/sports-calendar/SportsCalendarPage.jsx src/pages/sports-calendar/SportsCalendarPage.old.jsx

# Use new version
mv src/pages/sports-calendar/SportsCalendarPageNew.jsx src/pages/sports-calendar/SportsCalendarPage.jsx
```

### **Option 2: Add New Route**

**File:** `src/Routes.jsx`

```javascript
import LiveSportsCalendar from "pages/sports-calendar/SportsCalendarPageNew";

// Add route
<Route path="/live-calendar" element={<LiveSportsCalendar />} />
```

---

## 📊 Expected Results

### **When Live Matches Are Happening:**
```
┌─────────────────────────────────────┐
│ 🔴 LIVE NOW  2                      │
│ Real-time scores from...            │
│ ┌─────────┐  ┌─────────┐           │
│ │ Leeds   │  │ Oviedo  │           │
│ │ 1 : 0   │  │ 0 : 0   │           │
│ │ V. Villa│  │ R. Valle│           │
│ │ ⏱️ 45'  │  │ ⏱️ 84'  │           │
│ └─────────┘  └─────────┘           │
└─────────────────────────────────────┘
```

### **When No Live Matches:**
```
┌─────────────────────────────────────┐
│ 🕐 No Live Matches Right Now        │
│                                     │
│ Live matches typically happen       │
│ during evenings and weekends.       │
│                                     │
│ 📅 Peak hours: 6 PM - 11 PM         │
│ ⚡ Auto-updates every 15s           │
└─────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### **Issue: "Cannot connect to backend"**
**Fix:**
```bash
# Check if calendar service is running
curl http://localhost:8083/api/calendar/health

# Should return: "Calendar Service is healthy"
```

### **Issue: "No matches showing" (when matches should be live)**
**Fix:**
```bash
# Check database
docker exec highlights-postgres psql -U postgres -d calendar_service -c "SELECT COUNT(*) FROM fixtures WHERE is_live = true;"

# If 0, the API might not have live matches at this time
# Try during peak hours (6 PM - 11 PM)
```

### **Issue: "Components not found"**
**Fix:**
```bash
# Ensure new components exist
ls src/components/calendar/LiveMatchCard.jsx
ls src/components/calendar/LiveCalendar.jsx

# If not, they need to be created (see component files)
```

---

## 🎯 Testing Checklist

Before showing to users:

- [ ] Backend is running (`mvn spring-boot:run`)
- [ ] Frontend is running (`npm run dev`)
- [ ] Can access `/sports-calendar` page
- [ ] Live matches load (if any available)
- [ ] Auto-refresh works (watch for 15s)
- [ ] Manual refresh button works
- [ ] Empty state shows when no matches
- [ ] Mobile view looks good (resize browser)
- [ ] Dark mode works (toggle system theme)
- [ ] No console errors

---

## 📈 Next Steps

### **Immediate (Today):**
1. ✅ Test the new components
2. ✅ Verify auto-refresh works
3. ✅ Check mobile responsiveness
4. ✅ Share with team for feedback

### **This Week:**
1. Add match detail modal (click card)
2. Implement league filters
3. Add favorite teams feature
4. Set up analytics tracking

### **Next Week:**
1. User testing (5-10 users)
2. Gather feedback
3. Iterate on UI/UX
4. Prepare for launch

---

## 💡 Tips for Best Results

### **1. Test During Peak Hours:**
- Premier League: Saturdays 12:30 PM - 5:30 PM GMT
- La Liga: Saturdays 1:00 PM - 9:00 PM CET
- Champions League: Tuesdays/Wednesdays 8:00 PM CET

### **2. Watch the Auto-Refresh:**
- Open browser DevTools (F12)
- Go to Network tab
- Watch for requests every 15 seconds
- Status should be 200 OK

### **3. Mobile Testing:**
- Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
- Test on: iPhone 12, iPad, Galaxy S20
- Check: Touch targets, spacing, readability

---

## 🎨 Customization

### **Change Auto-Refresh Interval:**

**File:** `src/components/calendar/LiveCalendar.jsx`
```javascript
// Line ~55
const interval = setInterval(() => {
  fetchLiveMatches(false);
}, 15000); // Change to 30000 for 30 seconds
```

### **Change Theme Colors:**

**File:** `src/pages/sports-calendar/SportsCalendarPageNew.jsx`
```javascript
// Hero gradient
className="bg-gradient-to-r from-blue-600 to-purple-600"

// Change to green:
className="bg-gradient-to-r from-green-600 to-emerald-600"
```

### **Add More Leagues:**

**File:** `src/pages/sports-calendar/SportsCalendarPageNew.jsx`
```javascript
{ name: 'Bundesliga', icon: '⚽', gradient: 'from-red-600 to-yellow-500' },
```

---

## 📞 Support

**Issues?** Check:
1. `LIVE_CALENDAR_FRONTEND.md` - Full documentation
2. `LIVE_FIRST_STRATEGY.md` - Backend strategy
3. Console logs in browser DevTools
4. Service logs in terminal

**Questions?**
- Backend: Check `services/calendar-service/README.md`
- Frontend: Check component JSDoc comments

---

**You're all set! 🎉**

The Live-First Sports Calendar is ready to show users real-time match action!
