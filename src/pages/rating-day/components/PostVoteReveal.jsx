import React from 'react';
import { motion } from 'framer-motion';

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
      <div className="text-xs uppercase tracking-widest text-emerald-500 font-bold mb-1">Your Pick</div>
      <div className="text-2xl font-black text-white">{winner.name || winner.displayName}</div>

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

      <div className="mt-6 text-xs text-slate-500">Next matchup loading in 2s...</div>
    </motion.div>
  );
};

export default PostVoteReveal;
