# Rating Day UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Rating Day page with a gaming/tournament bracket aesthetic — dark theme, countdown timer, power bars, round timer, community prediction reveal, and sound effects.

**Architecture:** Frontend-only redesign. No backend changes. All new features (countdown, power bars, community prediction, round timer, sound) derive from existing API data or pure client-side logic. The page uses 4 states: Pre-Rating Day (countdown + hall of fame), Active Voting (fight screen), Closed (awaiting finalization), and Post-Vote Reveal (ELO + community bar interstitial).

**Tech Stack:** React 18, TailwindCSS, framer-motion (already in project), Web Audio API (for sounds), localStorage (for user preferences)

**Spec:** `docs/superpowers/specs/2026-03-22-rating-day-ui-redesign.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/pages/rating-day/components/CountdownTimer.jsx` | Big 4-block countdown (days/hours/min/sec) with hype mode |
| `src/pages/rating-day/components/PowerBars.jsx` | 3 horizontal stat bars (ELO, Win Rate, Momentum) per player |
| `src/pages/rating-day/components/PostVoteReveal.jsx` | ELO change display + community prediction bar |
| `src/pages/rating-day/components/RoundTimer.jsx` | 30s per-matchup countdown bar with DECIDE! flash |
| `src/pages/rating-day/components/HallOfFame.jsx` | Top 5 player cards row for pre-rating day & closed states |
| `src/pages/rating-day/components/PreviewMatchups.jsx` | Non-votable teaser matchup cards (hype mode) |
| `src/pages/rating-day/components/LiveBanner.jsx` | "RATING DAY IS LIVE" / "VOTING HAS ENDED" gradient bar |
| `src/pages/rating-day/hooks/useRoundTimer.js` | Round timer logic: countdown, auto-skip, localStorage toggle |
| `src/pages/rating-day/hooks/useSoundEffects.js` | Web Audio API oscillator sounds, enabled toggle, playSound() |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/rating-day/index.jsx` | Complete rewrite: dark theme, 4 states, countdown, sport pills, tabs, sidebar placement |
| `src/pages/rating-day/components/MatchupCard.jsx` | Dark gaming restyle, integrate PowerBars, blue/red team colors |
| `src/pages/rating-day/components/NominationPanel.jsx` | Restyle to dark theme |
| `src/pages/rating-day/components/RatingDayResults.jsx` | Restyle to dark theme |

---

## Task 1: CountdownTimer Component

**Files:**
- Create: `src/pages/rating-day/components/CountdownTimer.jsx`

The big 4-block countdown timer used in the pre-rating day state. Accepts a `targetDate` (Date or ISO string) and ticks every second. Supports hype mode (pulsing glow) when within last 24 hours.

- [ ] **Step 1: Create CountdownTimer.jsx**

```jsx
import React, { useState, useEffect, useRef } from 'react';

const CountdownTimer = ({ targetDate, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isHypeMode, setIsHypeMode] = useState(false);
  const [expired, setExpired] = useState(false);
  // Use ref for onExpired to avoid restarting interval when callback reference changes
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    const update = () => {
      const target = new Date(targetDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        onExpiredRef.current?.();
        return;
      }

      setIsHypeMode(diff <= 24 * 60 * 60 * 1000);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) return null;

  const blocks = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];

  return (
    <div className="flex justify-center items-center gap-3 sm:gap-4">
      {blocks.map((block, i) => (
        <React.Fragment key={block.label}>
          {i > 0 && (
            <span className="text-2xl text-white/20 font-light pt-2">:</span>
          )}
          <div
            className={`bg-white/5 border rounded-xl px-4 py-3 sm:px-6 sm:py-4 min-w-[70px] sm:min-w-[80px] text-center
              ${isHypeMode
                ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse'
                : 'border-amber-500/30'
              }`}
          >
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-amber-500">
              {String(block.value).padStart(2, '0')}
            </div>
            <div className="text-[0.625rem] uppercase tracking-widest text-slate-400 mt-1">
              {block.label}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default CountdownTimer;
```

- [ ] **Step 2: Verify it renders**

Temporarily import into `index.jsx` and render with a test date to confirm visual output. Remove after verification.

- [ ] **Step 3: Commit**

```bash
git add src/pages/rating-day/components/CountdownTimer.jsx
git commit -m "feat(rating-day): add CountdownTimer component with hype mode"
```

---

## Task 2: HallOfFame and PreviewMatchups Components

**Files:**
- Create: `src/pages/rating-day/components/HallOfFame.jsx`
- Create: `src/pages/rating-day/components/PreviewMatchups.jsx`

These render in the pre-rating day and closed states. HallOfFame shows top 5 ranked players. PreviewMatchups generates random nearby-rank pairs from fetched player data.

- [ ] **Step 1: Create HallOfFame.jsx**

```jsx
import React from 'react';

const rankColors = {
  1: 'text-amber-500 border-amber-500/30',
  2: 'text-gray-300 border-gray-300/20',
  3: 'text-orange-400 border-orange-400/20',
};

const HallOfFame = ({ players = [] }) => {
  const top5 = players.slice(0, 5);
  if (top5.length === 0) return null;

  return (
    <div>
      <div className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-3">
        Current Hall of Fame — Top 5
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {top5.map((p, i) => (
          <div
            key={p.id}
            className={`bg-white/5 rounded-lg p-3 text-center border ${rankColors[i + 1] || 'border-white/10'}`}
          >
            <div className={`text-xl font-black ${rankColors[i + 1]?.split(' ')[0] || 'text-slate-400'}`}>
              #{i + 1}
            </div>
            <div className="text-xs font-semibold text-white mt-1 truncate">
              {p.displayName || p.name}
            </div>
            <div className="text-[0.625rem] text-slate-400 mt-0.5">
              {Math.round(p.eloScore || p.rating || 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HallOfFame;
```

- [ ] **Step 2: Create PreviewMatchups.jsx**

```jsx
import React, { useMemo } from 'react';

const PreviewMatchups = ({ players = [] }) => {
  const matchups = useMemo(() => {
    if (players.length < 4) return [];
    const pairs = [];
    const used = new Set();
    for (let attempt = 0; attempt < 20 && pairs.length < 2; attempt++) {
      const idx = Math.floor(Math.random() * Math.min(players.length - 1, 15));
      const range = Math.min(5, players.length - idx - 1);
      const offset = 1 + Math.floor(Math.random() * range);
      const a = idx;
      const b = idx + offset;
      const key = `${a}-${b}`;
      if (!used.has(key) && b < players.length) {
        used.add(key);
        pairs.push([players[a], players[b]]);
      }
    }
    return pairs;
  }, [players]);

  if (matchups.length === 0) return null;

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
      <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">
        Preview Matchups (non-votable)
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matchups.map(([p1, p2], i) => (
          <div key={i} className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-sm font-bold text-white">{p1.displayName || p1.name}</div>
            <div className="text-[0.625rem] text-slate-400">
              #{p1.currentRank || '-'} — ELO {Math.round(p1.eloScore || p1.rating || 0)}
            </div>
            <div className="text-white/30 text-lg font-bold my-2">VS</div>
            <div className="text-sm font-bold text-white">{p2.displayName || p2.name}</div>
            <div className="text-[0.625rem] text-slate-400">
              #{p2.currentRank || '-'} — ELO {Math.round(p2.eloScore || p2.rating || 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviewMatchups;
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/rating-day/components/HallOfFame.jsx src/pages/rating-day/components/PreviewMatchups.jsx
git commit -m "feat(rating-day): add HallOfFame and PreviewMatchups components"
```

---

## Task 3: PowerBars Component

**Files:**
- Create: `src/pages/rating-day/components/PowerBars.jsx`

Three horizontal stat bars per player: ELO Rating, Win Rate, Momentum. Colors match the player's team side (blue/red).

- [ ] **Step 1: Create PowerBars.jsx**

```jsx
import React from 'react';

const PowerBars = ({ elo, rank, accentColor = 'blue' }) => {
  // ELO bar: normalize to 1200-1800 range
  const eloPercent = Math.min(100, Math.max(0, ((elo || 1500) - 1200) / 600 * 100));
  // Momentum: derive from rank (rank 1 = 100%, rank 100 = 5%)
  const momentumPercent = rank ? Math.max(5, 100 - (rank - 1)) : 50;
  // Win Rate: not available from API, derive from ELO position
  const winRatePercent = Math.min(95, Math.max(30, eloPercent * 0.85 + 10));

  const colors = {
    blue: { elo: 'from-blue-500 to-blue-400', text: 'text-blue-500' },
    red: { elo: 'from-red-500 to-red-400', text: 'text-red-500' },
  };
  const c = colors[accentColor] || colors.blue;

  const bars = [
    { label: 'ELO RATING', value: Math.round(elo || 0), percent: eloPercent, gradient: c.elo, valueColor: c.text },
    { label: 'WIN RATE', value: `${Math.round(winRatePercent)}%`, percent: winRatePercent, gradient: 'from-emerald-500 to-emerald-400', valueColor: 'text-emerald-500' },
    { label: 'MOMENTUM', value: rank ? `#${rank}` : '—', percent: momentumPercent, gradient: 'from-amber-500 to-amber-400', valueColor: 'text-amber-500' },
  ];

  return (
    <div className="space-y-2 w-full">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="flex justify-between text-[0.625rem] text-slate-400 mb-0.5">
            <span>{bar.label}</span>
            <span className={`font-bold ${bar.valueColor}`}>{bar.value}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${bar.gradient} rounded-full transition-all duration-700`}
              style={{ width: `${bar.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PowerBars;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/rating-day/components/PowerBars.jsx
git commit -m "feat(rating-day): add PowerBars stat visualization component"
```

---

## Task 4: RoundTimer Hook and Component

**Files:**
- Create: `src/pages/rating-day/hooks/useRoundTimer.js`
- Create: `src/pages/rating-day/components/RoundTimer.jsx`

30-second per-matchup countdown. Auto-skips when expired. Toggleable via localStorage. Flashes "DECIDE!" in last 5 seconds.

- [ ] **Step 1: Create useRoundTimer.js**

```js
import { useState, useEffect, useCallback, useRef } from 'react';

const ROUND_DURATION = 30;
const STORAGE_KEY = 'ratingDay.roundTimerEnabled';

export const useRoundTimer = ({ matchupKey, onExpired }) => {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
  });
  const [secondsLeft, setSecondsLeft] = useState(ROUND_DURATION);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  // Use ref for onExpired to avoid resetting the interval on every render
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const toggleEnabled = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  // Pause/resume for error states
  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  // Reset timer when matchup changes
  useEffect(() => {
    setSecondsLeft(ROUND_DURATION);
    setPaused(false);
  }, [matchupKey]);

  // Tick down
  useEffect(() => {
    if (!enabled || paused) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpiredRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [enabled, paused, matchupKey]);

  return {
    enabled,
    toggleEnabled,
    secondsLeft,
    progress: secondsLeft / ROUND_DURATION,
    isUrgent: secondsLeft <= 10,
    isCritical: secondsLeft <= 5,
    paused,
    pause,
    resume,
  };
};
```

- [ ] **Step 2: Create RoundTimer.jsx**

```jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from 'components/AppIcon';

const RoundTimer = ({ enabled, toggleEnabled, secondsLeft, progress, isUrgent, isCritical, matchNumber, maxMatches }) => {
  return (
    <div className="px-4 sm:px-6 pt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Match {matchNumber || '?'} of {maxMatches || 50}
        </span>
        <div className="flex items-center gap-2">
          {enabled && (
            <>
              <span className={`text-xs font-bold uppercase ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
                Round Timer
              </span>
              <span className={`font-mono text-base font-black ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
                0:{String(secondsLeft).padStart(2, '0')}
              </span>
            </>
          )}
          <button
            onClick={toggleEnabled}
            className={`p-1 rounded transition-colors ${enabled ? 'text-amber-500 hover:text-amber-400' : 'text-slate-500 hover:text-slate-400'}`}
            title={enabled ? 'Disable round timer' : 'Enable round timer'}
          >
            <Icon name="Timer" size={16} />
          </button>
        </div>
      </div>

      {enabled && (
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 linear ${
              isCritical ? 'bg-red-500 animate-pulse' : isUrgent ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <AnimatePresence>
        {isCritical && enabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-2"
          >
            <span className="text-red-500 font-black text-sm uppercase tracking-wider animate-pulse">
              Decide!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoundTimer;
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/rating-day/hooks/useRoundTimer.js src/pages/rating-day/components/RoundTimer.jsx
git commit -m "feat(rating-day): add RoundTimer with 30s countdown and DECIDE! flash"
```

---

## Task 5: PostVoteReveal Component

**Files:**
- Create: `src/pages/rating-day/components/PostVoteReveal.jsx`

Shows ELO changes and community prediction bar after each vote. 2-second display before auto-transition.

- [ ] **Step 1: Create PostVoteReveal.jsx**

```jsx
import React from 'react';
import { motion } from 'framer-motion';

/**
 * Calculate clamped community prediction from ELO difference.
 * Uses standard ELO expected score formula, clamped to 25-75%.
 */
const getCommunityPrediction = (elo1, elo2) => {
  const expected = 1 / (1 + Math.pow(10, ((elo2 || 1500) - (elo1 || 1500)) / 400));
  const pct = Math.round(Math.min(0.75, Math.max(0.25, expected)) * 100);
  return { player1Pct: pct, player2Pct: 100 - pct };
};

const PostVoteReveal = ({ voteResult, player1, player2, winnerId }) => {
  if (!voteResult) return null;

  const winner = winnerId === player1.id ? player1 : player2;
  const loser = winnerId === player1.id ? player2 : player1;
  const winnerChange = winnerId === player1.id ? voteResult.player1EloChange : voteResult.player2EloChange;
  const loserChange = winnerId === player1.id ? voteResult.player2EloChange : voteResult.player1EloChange;

  const { player1Pct, player2Pct } = getCommunityPrediction(player1.elo, player2.elo);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-8"
    >
      {/* Winner announcement */}
      <div className="text-xs uppercase tracking-widest text-emerald-500 font-bold mb-1">Your Pick</div>
      <div className="text-2xl font-black text-white">{winner.name || winner.displayName}</div>

      {/* ELO changes */}
      <div className="flex justify-center gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-6 py-4"
        >
          <div className="text-xs text-slate-400">{winner.name || winner.displayName}</div>
          <div className="text-2xl font-black text-emerald-500">
            +{Math.abs(winnerChange || 0).toFixed(1)}
          </div>
          <div className="text-[0.625rem] text-slate-400">
            {Math.round(winner.elo || 0)} → {Math.round((winner.elo || 0) + (winnerChange || 0))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-4"
        >
          <div className="text-xs text-slate-400">{loser.name || loser.displayName}</div>
          <div className="text-2xl font-black text-red-500">
            {(loserChange || 0).toFixed(1)}
          </div>
          <div className="text-[0.625rem] text-slate-400">
            {Math.round(loser.elo || 0)} → {Math.round((loser.elo || 0) + (loserChange || 0))}
          </div>
        </motion.div>
      </div>

      {/* Community prediction bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-5 max-w-md mx-auto mt-6"
      >
        <div className="text-[0.625rem] uppercase tracking-widest text-violet-500 font-bold mb-3">
          Community Lean — Based on ELO Ratings
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white min-w-[50px] text-right truncate">
            {player1.name || player1.displayName}
          </span>
          <div className="flex-1 h-6 bg-white/10 rounded overflow-hidden flex">
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${player1Pct}%` }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center text-xs font-bold text-white"
            >
              {player1Pct}%
            </motion.div>
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${player2Pct}%` }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-xs font-bold text-white"
            >
              {player2Pct}%
            </motion.div>
          </div>
          <span className="text-sm font-bold text-white min-w-[50px] truncate">
            {player2.name || player2.displayName}
          </span>
        </div>
      </motion.div>

      {/* Loading next */}
      <div className="mt-6 text-xs text-slate-500">Next matchup loading in 2s...</div>
    </motion.div>
  );
};

export default PostVoteReveal;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/rating-day/components/PostVoteReveal.jsx
git commit -m "feat(rating-day): add PostVoteReveal with ELO changes and community prediction"
```

---

## Task 6: LiveBanner Component

**Files:**
- Create: `src/pages/rating-day/components/LiveBanner.jsx`

Gradient bar at top during active voting ("RATING DAY IS LIVE") and closed state ("VOTING HAS ENDED").

- [ ] **Step 1: Create LiveBanner.jsx**

```jsx
import React from 'react';

const LiveBanner = ({ status, timeRemaining, totalVotes, totalVoters }) => {
  if (status === 'ACTIVE') {
    return (
      <div className="bg-gradient-to-r from-red-500 to-amber-500 px-4 sm:px-6 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-extrabold text-sm tracking-wide text-white">RATING DAY IS LIVE</span>
        </div>
        <div className="font-mono font-bold text-sm text-white">{timeRemaining || ''}</div>
      </div>
    );
  }

  if (status === 'CLOSED') {
    return (
      <div className="bg-gradient-to-r from-slate-600 to-slate-500 px-4 sm:px-6 py-2.5 flex justify-between items-center">
        <span className="font-extrabold text-sm tracking-wide text-white">VOTING HAS ENDED</span>
        <div className="flex items-center gap-4 text-sm text-white/80">
          {totalVotes != null && <span>{totalVotes.toLocaleString()} votes</span>}
          {totalVoters != null && <span>{totalVoters.toLocaleString()} voters</span>}
        </div>
      </div>
    );
  }

  return null;
};

export default LiveBanner;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/rating-day/components/LiveBanner.jsx
git commit -m "feat(rating-day): add LiveBanner for ACTIVE and CLOSED states"
```

---

## Task 7: Sound Effects Hook

**Files:**
- Create: `src/pages/rating-day/hooks/useSoundEffects.js`

Web Audio API synthetic sounds. Muted by default. AudioContext resumed on user gesture (toggle click).

- [ ] **Step 1: Create useSoundEffects.js**

```js
import { useState, useRef, useCallback } from 'react';

const STORAGE_KEY = 'ratingDay.soundEnabled';

export const useSoundEffects = () => {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true'; }
    catch { return false; }
  });
  const ctxRef = useRef(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const toggleEnabled = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      // Resume AudioContext on the same user gesture
      if (next) getCtx();
      return next;
    });
  }, []);

  const playSound = useCallback((type) => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      switch (type) {
        case 'whoosh':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
          break;
        case 'confirm':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523, ctx.currentTime);
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
          break;
        case 'tick':
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.05);
          break;
        case 'buzzer':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
          break;
        default:
          osc.disconnect();
          return;
      }
    } catch {
      // Silently fail — sound is non-critical
    }
  }, [enabled]);

  return { enabled, toggleEnabled, playSound };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/rating-day/hooks/useSoundEffects.js
git commit -m "feat(rating-day): add useSoundEffects hook with Web Audio API oscillators"
```

---

## Task 8: Restyle MatchupCard to Dark Gaming Theme

**Files:**
- Modify: `src/pages/rating-day/components/MatchupCard.jsx`

Full restyle: dark background, blue/red team colors, integrate PowerBars, glowing VS badge.

- [ ] **Step 1: Rewrite MatchupCard.jsx**

Replace the entire file content. Key changes from current:
- Dark card backgrounds (`bg-white/[0.03]`) instead of `bg-card`
- Blue border/accent for player 1, red for player 2
- Import and render `PowerBars` component on each player card
- "PICK [NAME]" styled buttons instead of hover hints
- VS badge with glow shadow
- Remove `motion.button` wrapper — use `div` with `onClick` for cleaner control

Full code: see spec Section 1 State 2 for the layout. The component signature stays the same: `({ matchup, onVote, onSkip, isVoting, voteResult })`. Internal `PlayerSide` sub-component gets `accentColor` prop ("blue" or "red") passed to `PowerBars`.

Key structural changes to `PlayerSide`:
```jsx
// Add to imports
import PowerBars from './PowerBars';

// In PlayerSide, after ELO badge, before vote hint:
<PowerBars elo={player.elo} rank={player.rank} accentColor={side === 'left' ? 'blue' : 'red'} />

// Replace hover hint with explicit PICK button:
{!winner && !isVoting && (
  <div className={`mt-4 border rounded-lg py-3 px-4 font-bold text-sm text-center
    ${side === 'left'
      ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
      : 'bg-red-500/10 border-red-500/30 text-red-500'
    }`}>
    PICK {(player.displayName || player.name || '').split(' ').pop()?.toUpperCase()}
  </div>
)}
```

Card border classes change to:
```
border-2 ${side === 'left' ? 'border-blue-500/30' : 'border-red-500/30'}
```

Avatar border changes to team color. VS badge gets `shadow-[0_0_30px_rgba(239,68,68,0.4)]`.

- [ ] **Step 2: Verify matchup renders with dark theme**

Start the frontend (`npm run dev`), navigate to `/rating-day`, confirm the card styling if there's active data, or temporarily mock a matchup object.

- [ ] **Step 3: Commit**

```bash
git add src/pages/rating-day/components/MatchupCard.jsx
git commit -m "feat(rating-day): restyle MatchupCard to dark gaming theme with PowerBars"
```

---

## Task 9: Restyle NominationPanel and RatingDayResults

**Files:**
- Modify: `src/pages/rating-day/components/NominationPanel.jsx`
- Modify: `src/pages/rating-day/components/RatingDayResults.jsx`

Restyle both to dark theme. Keep all logic identical. Only change Tailwind classes.

- [ ] **Step 1: Restyle NominationPanel.jsx**

Class changes throughout the file:
- `bg-card` → `bg-white/[0.03]`
- `border-border` → `border-white/10`
- `text-text-primary` → `text-white`
- `text-text-secondary` → `text-slate-400`
- `bg-muted` → `bg-white/5`
- `text-accent` → `text-amber-500`
- `hover:bg-accent/10` → `hover:bg-amber-500/10`
- `hover:text-accent` → `hover:text-amber-500`
- Status pill colors stay the same (emerald/red/yellow/blue — they work on dark)

- [ ] **Step 2: Restyle RatingDayResults.jsx**

Same class changes:
- `bg-card` → `bg-white/[0.03]`
- `border-border` → `border-white/10`
- `text-text-primary` → `text-white`
- `text-text-secondary` → `text-slate-400`
- `bg-muted` → `bg-white/5`
- `text-accent` → `text-amber-500`
- `bg-accent/5` → `bg-amber-500/5`
- `border-accent/20` → `border-amber-500/20`

- [ ] **Step 3: Commit**

```bash
git add src/pages/rating-day/components/NominationPanel.jsx src/pages/rating-day/components/RatingDayResults.jsx
git commit -m "feat(rating-day): restyle NominationPanel and RatingDayResults to dark theme"
```

---

## Task 10: Rewrite Main Page (index.jsx)

**Files:**
- Modify: `src/pages/rating-day/index.jsx`

This is the big one. Complete rewrite of the page layout to wire up all new components and handle all 4 states.

- [ ] **Step 1: Rewrite index.jsx**

Key changes from current implementation:

**New imports:**
```jsx
import CountdownTimer from './components/CountdownTimer';
import HallOfFame from './components/HallOfFame';
import PreviewMatchups from './components/PreviewMatchups';
import LiveBanner from './components/LiveBanner';
import RoundTimer from './components/RoundTimer';
import PostVoteReveal from './components/PostVoteReveal';
import { useRoundTimer } from './hooks/useRoundTimer';
import { useSoundEffects } from './hooks/useSoundEffects';
import playerApiService from 'services/playerApiService';
```

**New state:**
```jsx
const [topPlayers, setTopPlayers] = useState([]);
const [showReveal, setShowReveal] = useState(false);
```

**New hooks:**
```jsx
const roundTimer = useRoundTimer({
  matchupKey: matchup ? `${matchup.player1Id}-${matchup.player2Id}` : null,
  onExpired: handleSkip, // handleSkip must be wrapped in useCallback (preserved from existing code)
});
const sound = useSoundEffects();
```

**Derived values:**
```jsx
const targetDate = getNextRatingDayDate();
const isWithin24h = targetDate && (targetDate.getTime() - Date.now()) <= 24 * 60 * 60 * 1000;
```

**Sound integration with round timer (useEffect in index.jsx):**
```jsx
useEffect(() => {
  if (roundTimer.isCritical && roundTimer.enabled && roundTimer.secondsLeft > 0) {
    sound.playSound('tick');
  }
  if (roundTimer.enabled && roundTimer.secondsLeft === 0) {
    sound.playSound('buzzer');
  }
}, [roundTimer.secondsLeft, roundTimer.isCritical, roundTimer.enabled]);
```

**Fetch top players for HallOfFame/Preview:**
```jsx
useEffect(() => {
  playerApiService.getTop100BySport(selectedSport)
    .then(data => setTopPlayers(data?.players?.slice(0, 20) || []))
    .catch(() => setTopPlayers([]));
}, [selectedSport]);
```

**Calculate next Rating Day date:**
```jsx
const getNextRatingDayDate = () => {
  if (ratingDay?.status === 'UPCOMING' && ratingDay.opensAt) {
    return new Date(ratingDay.opensAt);
  }
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
};
```

**Vote handler updated for PostVoteReveal + sound:**
```jsx
const handleVote = async (winnerId) => {
  if (!matchup || !ratingDay || isVoting) return;
  setIsVoting(true);
  setError('');
  try {
    const result = await ratingDayService.submitVote(ratingDay.id, matchup.player1Id, matchup.player2Id, winnerId);
    setVoteResult(result);
    setShowReveal(true);
    setCompletedVotes(prev => prev + 1);
    sound.playSound('confirm');
    setTimeout(() => {
      setShowReveal(false);
      if (result.nextMatchup) {
        setMatchup(result.nextMatchup);
        setVoteResult(null);
        sound.playSound('whoosh');
      } else {
        setMatchup(null);
        setVoteResult(null);
      }
    }, 2000);
  } catch (err) {
    setError(err.message || 'Vote failed');
    roundTimer.pause(); // Pause round timer on error so it doesn't auto-skip
  } finally {
    setIsVoting(false);
  }
};
```

**Layout structure (JSX):**

```
<div className="min-h-screen bg-[#0a0a1a]">
  <Header />
  <main className="pt-16 pb-20 lg:pb-8">

    {/* Sport pills - always visible */}
    <div className="bg-white/[0.02] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2">
        {SPORTS.map(s => <button ...gaming styled pill... />)}
      </div>
    </div>

    {/* LiveBanner - ACTIVE or CLOSED */}
    <LiveBanner status={ratingDay?.status} timeRemaining={timeRemaining} totalVotes={ratingDay?.totalVotes} totalVoters={ratingDay?.totalVoters} />

    {/* State: Pre-Rating Day */}
    {!loading && (!ratingDay || ratingDay.status === 'UPCOMING') && tab === 'vote' && (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-xs uppercase tracking-widest text-amber-500 font-bold mb-2">NEXT RATING DAY</div>
        <h1 className="text-3xl font-black text-white bg-gradient-to-r from-amber-500 via-red-500 to-violet-500 bg-clip-text text-transparent">
          {SPORTS.find(s => s.key === selectedSport)?.label?.toUpperCase()}
        </h1>
        <div className="mt-8"><CountdownTimer targetDate={getNextRatingDayDate()} onExpired={loadRatingDay} /></div>
        <p className="text-slate-400 text-sm mt-4">Rating Day opens on {getNextRatingDayDate().toLocaleDateString()} at 00:00 UTC</p>
        <div className="mt-10"><HallOfFame players={topPlayers} /></div>
        {/* Hype mode preview matchups if within 24h */}
        {isWithin24h && <div className="mt-8"><PreviewMatchups players={topPlayers} /></div>}
      </div>
    )}

    {/* State: CLOSED */}
    {!loading && ratingDay?.status === 'CLOSED' && tab === 'vote' && (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-xl font-bold text-white mb-2">Results Coming Soon</div>
        <p className="text-slate-400">The votes are being tallied...</p>
        <div className="mt-8"><HallOfFame players={topPlayers} /></div>
      </div>
    )}

    {/* State: ACTIVE voting */}
    {!loading && tab === 'vote' && ratingDay?.status === 'ACTIVE' && (
      <>
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto px-4 py-16 text-center">
            ...auth CTA card (dark styled)...
          </div>
        ) : showReveal ? (
          <div className="max-w-2xl mx-auto px-4">
            <PostVoteReveal voteResult={voteResult} player1={...} player2={...} winnerId={...} />
          </div>
        ) : matchup ? (
          <div>
            <div className="flex items-center justify-between max-w-5xl mx-auto px-4 pt-4">
              <RoundTimer {...roundTimer} matchNumber={completedVotes + 1} maxMatches={50} />
              {/* Sound toggle — speaker icon, top-right of voting area */}
              <button
                onClick={sound.toggleEnabled}
                className={`p-2 rounded-lg transition-colors ${sound.enabled ? 'text-amber-500' : 'text-slate-500 hover:text-slate-400'}`}
                title={sound.enabled ? 'Mute sounds' : 'Enable sounds'}
              >
                <Icon name={sound.enabled ? 'Volume2' : 'VolumeX'} size={18} />
              </button>
            </div>
            <div className="max-w-5xl mx-auto px-4 py-6">
              <MatchupCard matchup={matchup} onVote={handleVote} onSkip={handleSkip} isVoting={isVoting} voteResult={null} />
            </div>
          </div>
        ) : (
          <div>...all done victory screen...</div>
        )}

        {/* Sidebar below matchup: How It Works + Nominations */}
        <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
            ...How It Works (same 4 steps, dark themed)...
          </div>
          <NominationPanel ... />
        </div>
      </>
    )}

    {/* Tabs */}
    <div className="max-w-7xl mx-auto px-4 mt-6">
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit mb-6">
        {tabs.map(t => <button ...dark styled tab... />)}
      </div>
    </div>

    {/* Results tab - uses restyled RatingDayResults */}
    {/* History tab - apply same dark theme classes inline: bg-card → bg-white/[0.03], text-text-primary → text-white, text-text-secondary → text-slate-400, bg-muted → bg-white/5 */}
    ...
  </main>
  <TabNavigation />
</div>
```

- [ ] **Step 2: Verify all 4 states render correctly**

Run `npm run dev`, navigate to `/rating-day`:
- With no active Rating Day: should see countdown + Hall of Fame
- With active Rating Day + authenticated: should see fight screen
- With active Rating Day + not authenticated: should see auth CTA
- After voting: should see PostVoteReveal for 2 seconds

- [ ] **Step 3: Test sound effects**

Click the speaker icon to enable sounds. Vote on a matchup — should hear confirm sound. Enable round timer — should hear ticks in last 5 seconds.

- [ ] **Step 4: Test responsive layout**

Open browser dev tools, toggle mobile viewport. Verify:
- Player cards stack vertically
- Countdown blocks remain readable
- Power bars visible
- Tap targets are full width

- [ ] **Step 5: Commit**

```bash
git add src/pages/rating-day/index.jsx
git commit -m "feat(rating-day): complete page rewrite with gaming theme, countdown, fight screen"
```

---

## Task 11: Final Polish and Cleanup

**Files:**
- All files in `src/pages/rating-day/`

- [ ] **Step 1: Remove any temporary test code**

Check all files for TODO comments, console.log statements, or temporary mocks.

- [ ] **Step 2: Verify no broken imports**

Run: `npm run dev` and check browser console for import/module errors.

- [ ] **Step 3: Test full flow end-to-end**

1. Load `/rating-day` — see countdown or fight screen
2. Switch sports — data updates
3. Switch tabs (Vote/Results/History) — all render
4. If active: vote, see PostVoteReveal, auto-load next matchup
5. Toggle round timer on/off
6. Toggle sound on/off
7. Check mobile layout

- [ ] **Step 4: Commit final polish**

```bash
git add -A src/pages/rating-day/
git commit -m "feat(rating-day): polish and cleanup"
```
