import React from 'react';
import { motion } from 'framer-motion';
import Icon from 'components/AppIcon';

const MoverRow = ({ mover, index, type }) => {
  const isRiser = type === 'riser';
  return (
    <motion.div
      initial={{ opacity: 0, x: isRiser ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-400 w-6">
          #{mover.rankAfter}
        </span>
        <span className="font-semibold text-white">{mover.playerName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold flex items-center gap-0.5 ${isRiser ? 'text-emerald-500' : 'text-red-500'}`}>
          <Icon name={isRiser ? 'TrendingUp' : 'TrendingDown'} size={14} />
          {isRiser ? '+' : ''}{mover.rankChange}
        </span>
        <span className="text-xs text-slate-400">
          {Math.round(mover.eloAfter)} ELO
        </span>
      </div>
    </motion.div>
  );
};

const RatingDayResults = ({ results }) => {
  if (!results) return null;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-amber-500">{results.totalVotes?.toLocaleString() || 0}</div>
          <div className="text-sm text-slate-400 mt-1">Total Votes</div>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-amber-500">{results.totalVoters?.toLocaleString() || 0}</div>
          <div className="text-sm text-slate-400 mt-1">Unique Voters</div>
        </div>
      </div>

      {/* Biggest Risers */}
      {results.biggestRisers?.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Icon name="TrendingUp" size={20} className="text-emerald-500" />
            Biggest Risers
          </h3>
          <div className="space-y-2">
            {results.biggestRisers.map((m, i) => (
              <MoverRow key={m.playerId} mover={m} index={i} type="riser" />
            ))}
          </div>
        </div>
      )}

      {/* Biggest Fallers */}
      {results.biggestFallers?.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Icon name="TrendingDown" size={20} className="text-red-500" />
            Biggest Fallers
          </h3>
          <div className="space-y-2">
            {results.biggestFallers.map((m, i) => (
              <MoverRow key={m.playerId} mover={m} index={i} type="faller" />
            ))}
          </div>
        </div>
      )}

      {/* New Entrants */}
      {results.newEntrants?.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Icon name="UserPlus" size={20} className="text-amber-500" />
            New Entrants
          </h3>
          <div className="space-y-2">
            {results.newEntrants.map((e, i) => (
              <motion.div
                key={e.playerId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg"
              >
                <div>
                  <span className="font-semibold text-white">{e.playerName}</span>
                  {e.replacedPlayerName && (
                    <span className="text-xs text-slate-400 ml-2">
                      (replaces {e.replacedPlayerName})
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-amber-500">#{e.rank}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results.biggestRisers?.length && !results.biggestFallers?.length && results.totalVotes === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No votes recorded for this Rating Day</p>
        </div>
      )}
    </div>
  );
};

export default RatingDayResults;
