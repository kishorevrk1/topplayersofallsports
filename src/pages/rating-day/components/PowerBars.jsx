import React from 'react';

const PowerBars = ({ elo, rank, accentColor = 'blue' }) => {
  const eloPercent = Math.min(100, Math.max(0, ((elo || 1500) - 1200) / 600 * 100));
  const momentumPercent = rank ? Math.max(5, 100 - (rank - 1)) : 50;
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
