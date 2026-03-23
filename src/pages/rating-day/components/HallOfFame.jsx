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
