import React, { useState, useEffect, useRef } from 'react';

const CountdownTimer = ({ targetDate, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isHypeMode, setIsHypeMode] = useState(false);
  const [expired, setExpired] = useState(false);
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
