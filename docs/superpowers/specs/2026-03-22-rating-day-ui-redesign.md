# Rating Day UI Redesign — Design Spec

**Date:** 2026-03-22
**Status:** Approved
**Branch:** `highlight-service`

## Overview

Redesign the Rating Day page (`/rating-day`) with a gaming/tournament bracket aesthetic. The page should feel like a fighting game character select screen — dark backgrounds, glowing accents, power bars, VS splash, and a dramatic countdown timer. The page is never empty: when no Rating Day is active, it shows a countdown to the next one with a Hall of Fame view.

**Design direction:** Gaming / Tournament Bracket (Mortal Kombat select screen meets FIFA ratings)

---

## Section 1: Page States & Layout

The page has 4 primary states based on Rating Day status.

### State 1: Pre-Rating Day (UPCOMING / no active Rating Day)

**Layout:**
- Dark background (`#0a0a1a` or TailwindCSS `bg-gray-950`)
- Sport selector pills at top (same 5 sports: Football, Basketball, Cricket, Tennis, MMA)
- **Big countdown timer** — 4 blocks: Days, Hours, Minutes, Seconds
  - Each block: dark card with amber/gold monospace number, label below
  - Separated by `:` dividers
  - Counts down to `opens_at` of the next Rating Day
  - Below timer: "Rating Day opens on [date] at 00:00 UTC"
- **Hall of Fame — Top 5** — Row of 5 compact cards showing rank, name, ELO for current sport
- **Hype mode (last 24h before opens_at):**
  - Intensified animations (pulsing glow on countdown)
  - **Preview matchups** section — 2 non-votable matchup cards showing potential pairings
  - Preview matchups are generated client-side from the Top 100 data (random nearby-rank pairs)

**Data sources:**
- `GET /api/rating-day/current/{sport}` — if returns null/204, calculate next Rating Day date (1st of next month)
- `GET /api/players/top100/{sport}?page=0&size=20` — for Hall of Fame (top 5 displayed) and Preview Matchups (random nearby-rank pairs from the wider set). Fetched via existing playerApiService or a new helper method in `ratingDayService.js`.
- Preview matchups: client-side random pairing from the fetched top 20 data

### State 2: Active Voting (ACTIVE)

**Layout — "Fight Screen":**
- **Live banner** at top: gradient bar (red → amber), pulsing dot, "RATING DAY IS LIVE", remaining time in monospace
- **Round timer bar** below banner: "MATCH 7 OF 50" left, "ROUND TIMER 0:24" right, thin progress bar depleting
- **Two player cards** side by side (blue team left, red team right):
  - Player avatar (circular, colored border matching team)
  - Name, position, nationality
  - Rank badge
  - **Power bars** (3 stats):
    - ELO Rating — bar filled proportional to max ELO in sport
    - Win Rate — percentage of matchups won this Rating Day (from vote result data)
    - Momentum — ELO change trend (positive = more fill, negative = less)
  - "PICK [NAME]" button at bottom of each card
- **VS badge** centered between cards — gradient circle with "VS" text, subtle glow/shadow
- **Skip button** below cards — subtle, secondary text
- **Sound toggle** — speaker icon in top-right corner, muted by default

**Not authenticated state:** Show the fight screen background and live banner, but hide the match counter, round timer, and player cards. Instead show a centered auth CTA card: "Sign in with Google to Vote" with the Google sign-in button. The page still feels alive (live banner, countdown) but the interactive elements are gated.

**All matchups completed state:** Victory screen — checkmark, "[N] votes submitted", thank you message

### State 3: Closed (Awaiting Finalization)

When `ratingDay.status === 'CLOSED'` (voting window ended, results not yet finalized):
- Dark background, same sport pills
- **"VOTING HAS ENDED" banner** replacing the live banner — muted gradient (slate/gray), no pulsing dot
- **Summary stats**: total votes cast, total voters (from `ratingDay.totalVotes` / `ratingDay.totalVoters`)
- **"Results coming soon"** message with a subtle loading animation
- **Hall of Fame Top 5** shown below (same as pre-rating day state)
- No matchup cards, no round timer, no interactive elements

### State 4: Post-Vote Reveal (2-second interstitial)

After each vote, before loading next matchup:
- **"YOUR PICK" label** + winner name
- **ELO change cards** side by side: winner shows green "+8.4" with old → new ELO, loser shows red "-8.4"
- **Community prediction bar**: horizontal bar split by percentage ("72% chose Messi | 28% chose Maradona"), purple theme
  - Text: "Based on [N] votes this matchup"
- "Next matchup loading in 2s..."
- Auto-transitions to next matchup

### Sidebar (Nominations & How It Works)

During active voting on desktop, the existing sidebar layout is preserved below the matchup area (not alongside — the fight screen needs full width). On completion of all matchups or when scrolling down:
- **"How It Works"** card — restyled to dark theme, same 4-step content
- **NominationPanel** — restyled to dark theme, same functionality

On mobile, these appear below the matchup area in a single column.

### Tabs

Keep existing 3 tabs (Vote, Results, History) but style them to match the dark gaming theme:
- Dark pill-style tab bar
- Active tab: gradient accent border/glow
- Results and History tabs: keep existing component logic, restyle to dark theme

---

## Section 2: New Features

### 2.1 Countdown Timer

**Pre-Rating Day countdown:**
- 4 block display: Days | Hours | Minutes | Seconds
- Each block: dark card with border glow, large monospace number, small label
- Color: amber/gold (#f59e0b) for numbers, slate for labels
- Ticks every second via `setInterval`
- Target: `opens_at` of next Rating Day, or 1st of next month if no Rating Day exists yet
- When target reached: page auto-refreshes to check for ACTIVE status

**Active Rating Day countdown:**
- Compact format in the live banner: "23:45:12 remaining" in monospace
- Same logic as existing `timeRemaining` state, just restyled

**Hype intensification (last 24h):**
- Countdown numbers get a pulsing glow animation (`animate-pulse` + custom glow shadow)
- Background gets subtle animated gradient shift
- Preview matchups section appears

### 2.2 Player Power Bars

Three horizontal bars per player card during active voting:

| Stat | Source | Bar Color | Calculation |
|------|--------|-----------|-------------|
| ELO Rating | `matchup.player1Elo` | Blue (P1) / Red (P2) | `elo / maxEloInSport` as percentage |
| Win Rate | Derived from vote results | Green | Track wins/total locally in component state |
| Momentum | `matchup.player1Elo - initialElo` or derived | Amber | Normalize to 0-100% scale |

**Implementation note:** Win Rate and Momentum may not be available from the current API response. For MVP:
- ELO Rating: available from matchup data
- Win Rate: show as "—" until we have backend data, or calculate from the user's own votes this session
- Momentum: derive from rank position (higher rank = more momentum bar fill)

Power bars use thin 6px height bars with gradient fills and rounded corners.

### 2.3 Community Prediction (Post-Vote)

After submitting a vote, the API already returns ELO changes. For the community prediction percentage:

**Option A (MVP — no backend change):** Use the ELO difference as a proxy for community sentiment. Higher ELO player likely has more community votes. Show a simulated percentage based on ELO gap.

**Option B (future — backend endpoint):** Add `GET /api/rating-day/{id}/matchup-stats?p1={id}&p2={id}` returning `{ player1Votes: N, player2Votes: N }`. Only called post-vote.

**For this redesign: use Option A.** Calculate approximate percentage from ELO expected score formula: `expected = 1 / (1 + 10^((elo2-elo1)/400))`. This gives a reasonable "community lean" without new backend work.

**Clamping:** Clamp displayed percentages to a 25%-75% range to maintain realism. Raw ELO math can produce 90/10 splits for large gaps, which looks implausible as "community" data.

Display: horizontal split bar with percentages, revealed with a fade-in animation after vote.

### 2.4 Per-Matchup Round Timer

- 30-second countdown per matchup
- Thin progress bar at top of matchup area, depleting left-to-right
- Color transitions: amber → red in last 10 seconds
- At 5 seconds: bar flashes, "DECIDE!" text appears briefly
- At 0 seconds: auto-skip (call `onSkip`)
- **Toggleable:** stored in localStorage `ratingDay.roundTimerEnabled`, default `false` (off by default — users opt in to the urgency)
- Toggle UI: small timer icon in the match counter area

**Implementation:** `useEffect` with `setInterval(1000)`, resets when matchup changes. Cleanup on unmount.

### 2.5 Sound Effects

Muted by default. Toggle via speaker icon (top-right of voting area).

| Event | Sound | Implementation |
|-------|-------|----------------|
| Matchup loads | Whoosh/reveal | Short audio clip on matchup state change |
| Vote submitted | Click/confirm | On vote handler |
| Round timer ≤ 5s | Tick | Each second in last 5 |
| Timer expired | Buzzer | On auto-skip |

**Implementation:**
- Use Web Audio API or simple `<audio>` elements
- Sound files: generate simple synthetic sounds using AudioContext oscillators (no external files needed)
- State: `soundEnabled` in localStorage, default `false`
- Utility: `playSound(type)` function that checks enabled state before playing
- **AudioContext resume:** When the user clicks the sound toggle to enable sounds, resume the AudioContext on that same click event (browsers require a user gesture to start AudioContext)

---

## Section 3: Styling & Theme

### Color Palette (Gaming Dark Theme)

| Element | Color | Tailwind |
|---------|-------|----------|
| Background | #0a0a1a | `bg-gray-950` or custom |
| Card background | rgba(255,255,255,0.03) | custom |
| Player 1 accent | #3b82f6 (blue) | `blue-500` |
| Player 2 accent | #ef4444 (red) | `red-500` |
| Countdown/timer | #f59e0b (amber) | `amber-500` |
| Win/positive | #10b981 (emerald) | `emerald-500` |
| Community reveal | #8b5cf6 (violet) | `violet-500` |
| Text primary | white | `text-white` |
| Text secondary | #94a3b8 | `text-slate-400` |
| Borders | rgba(255,255,255,0.1) | custom |

### Typography
- Countdown numbers: `font-mono font-black text-4xl`
- Player names: `font-extrabold text-xl`
- Labels: `uppercase tracking-wider text-xs`
- Power bar labels: `text-[0.625rem]` (10px)

### Animations
- Matchup card hover: `scale(1.02)` with framer-motion (keep existing)
- VS badge: subtle glow shadow pulse
- Post-vote ELO change: fade-in + slide-up
- Community bar: width animates from 0% to final percentage
- Round timer bar: smooth `transition-all duration-1000 linear`
- Hype mode (pre-rating day, last 24h): pulsing glow on countdown blocks

### Responsive
- Desktop: side-by-side player cards
- Mobile: cards stack vertically, full-width tap targets
- Countdown blocks: shrink to 2x2 grid on small screens
- Power bars: remain visible on mobile (important for the gaming feel)

---

## Section 4: Component Structure

### File Changes

**Modified files:**
- `src/pages/rating-day/index.jsx` — Complete rewrite of layout, add countdown logic for pre-rating day state, round timer state, sound state
- `src/pages/rating-day/components/MatchupCard.jsx` — Restyle to dark gaming theme, add power bars, round timer integration
- `src/pages/rating-day/components/RatingDayResults.jsx` — Restyle to dark theme
- `src/pages/rating-day/components/NominationPanel.jsx` — Restyle to dark theme

**New files:**
- `src/pages/rating-day/components/CountdownTimer.jsx` — Big countdown block component (days/hours/min/sec)
- `src/pages/rating-day/components/PowerBars.jsx` — Player stat bars component
- `src/pages/rating-day/components/PostVoteReveal.jsx` — ELO change + community prediction overlay
- `src/pages/rating-day/components/RoundTimer.jsx` — Per-matchup countdown bar
- `src/pages/rating-day/components/HallOfFame.jsx` — Top 5 preview for pre-rating day state
- `src/pages/rating-day/components/PreviewMatchups.jsx` — Non-votable matchup teasers
- `src/pages/rating-day/hooks/useSoundEffects.js` — Sound effect utility hook
- `src/pages/rating-day/hooks/useRoundTimer.js` — Round timer logic hook

### No Backend Changes Required

All features are frontend-only:
- Countdown timer: calculated from `ratingDay.opensAt` / `ratingDay.closesAt` or next month's 1st
- Power bars: derived from existing matchup data (ELO, rank)
- Community prediction: calculated from ELO expected score formula
- Round timer: pure frontend timer
- Sound effects: Web Audio API synthetic sounds
- Hall of Fame / Preview matchups: existing Top 100 API

---

## Section 5: Edge Cases

| Case | Behavior |
|------|----------|
| No Rating Day exists for sport | Show countdown to 1st of next month, "Coming Soon" |
| Rating Day CLOSED (between close and finalize) | Show "Voting ended — results coming soon" with last vote stats |
| User not authenticated + ACTIVE | Show fight screen with non-interactive cards, auth CTA overlay |
| All 50 matchups completed | Victory screen with total votes, "Come back next month" |
| Round timer expires | Auto-skip, no penalty, loads next matchup |
| Sound toggle | Persisted in localStorage, default muted |
| Mobile viewport | Cards stack vertically, countdown becomes 2x2 grid |
| API error loading matchup | Error banner with retry, round timer paused |

---

## What's NOT in Scope

- Backend API changes (no new endpoints)
- Vote streak / combo counter (deselected)
- Live community feed / WebSocket (deselected)
- Voter leaderboard (deselected)
- Actual community vote percentages (using ELO-derived proxy instead)
- Changes to Results or History tab logic (only restyled)
