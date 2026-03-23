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
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const toggleEnabled = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

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
