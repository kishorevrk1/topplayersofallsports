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
