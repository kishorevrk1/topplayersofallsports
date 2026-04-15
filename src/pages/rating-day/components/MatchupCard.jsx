import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'components/AppImage';
import Icon from 'components/AppIcon';
import PowerBars from './PowerBars';

const PlayerSide = ({ player, side, onVote, isVoting, winner, isWinner, isLoser }) => {
  const isLeft = side === 'left';
  const accentColor = isLeft ? 'blue' : 'red';
  const borderIdle = isLeft ? 'border-blue-500/30' : 'border-red-500/30';
  const borderWinner = 'border-emerald-400 ring-4 ring-emerald-400/30';
  const borderLoser = 'border-red-300/20 opacity-60';

  const borderColor = isWinner ? borderWinner : isLoser ? borderLoser : `${borderIdle} hover:ring-4 ${isLeft ? 'hover:ring-blue-500/20' : 'hover:ring-red-500/20'}`;

  return (
    <motion.button
      onClick={() => onVote(player)}
      disabled={isVoting || winner}
      className={`relative flex-1 bg-white/[0.03] rounded-2xl border-2 ${borderColor} p-6 lg:p-8 transition-all duration-300 cursor-pointer group disabled:cursor-default`}
      whileHover={!winner && !isVoting ? { scale: 1.02 } : {}}
      whileTap={!winner && !isVoting ? { scale: 0.98 } : {}}
    >
      {/* Winner badge */}
      <AnimatePresence>
        {isWinner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 z-10 shadow-lg"
          >
            <Icon name="Crown" size={14} />
            Winner
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player image */}
      <div className="flex flex-col items-center">
        <div className={`relative mb-4 ${isWinner ? 'ring-4 ring-emerald-400/40 rounded-full' : ''}`}>
          <Image
            src={player.photoUrl || player.player1PhotoUrl}
            alt={player.displayName || player.name}
            className={`w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-full object-cover border-4 shadow-xl ${isLeft ? 'border-blue-500/40' : 'border-red-500/40'}`}
          />
          {player.rank && (
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full shadow-md ${isLeft ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}>
              #{player.rank}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-center mt-2">
          {player.displayName || player.name}
        </h3>

        {/* Team & Position */}
        <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-400">
          {player.position && <span>{player.position}</span>}
          {player.position && player.team && <span className="text-white/10">|</span>}
          {player.team && <span>{player.team}</span>}
        </div>

        {/* Nationality */}
        {player.nationality && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
            <Icon name="MapPin" size={12} />
            <span>{player.nationality}</span>
          </div>
        )}

        {/* PowerBars */}
        <div className="mt-4 w-full">
          <PowerBars elo={player.elo} rank={player.rank} accentColor={accentColor} />
        </div>

        {/* ELO change after vote */}
        <AnimatePresence>
          {isWinner && player.eloChange != null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm font-semibold text-emerald-500"
            >
              +{Math.abs(player.eloChange).toFixed(1)} ELO
            </motion.div>
          )}
          {isLoser && player.eloChange != null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-sm font-semibold text-red-500"
            >
              {player.eloChange.toFixed(1)} ELO
            </motion.div>
          )}
        </AnimatePresence>

        {/* PICK button */}
        {!winner && !isVoting && (
          <div className={`mt-4 border rounded-lg py-3 px-4 font-bold text-sm text-center w-full
            ${isLeft
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
            PICK {(player.displayName || player.name || '').split(' ').pop()?.toUpperCase()}
          </div>
        )}
      </div>
    </motion.button>
  );
};

const MatchupCard = ({ matchup, onVote, onSkip, isVoting, voteResult }) => {
  if (!matchup) return null;

  const player1 = {
    id: matchup.player1Id,
    name: matchup.player1Name,
    displayName: matchup.player1DisplayName,
    photoUrl: matchup.player1PhotoUrl,
    position: matchup.player1Position,
    nationality: matchup.player1Nationality,
    rank: matchup.player1Rank,
    elo: matchup.player1Elo,
    team: matchup.player1Team,
    eloChange: voteResult?.player1EloChange,
  };

  const player2 = {
    id: matchup.player2Id,
    name: matchup.player2Name,
    displayName: matchup.player2DisplayName,
    photoUrl: matchup.player2PhotoUrl,
    position: matchup.player2Position,
    nationality: matchup.player2Nationality,
    rank: matchup.player2Rank,
    elo: matchup.player2Elo,
    team: matchup.player2Team,
    eloChange: voteResult?.player2EloChange,
  };

  const winnerId = voteResult ? (voteResult.player1EloChange > 0 ? player1.id : player2.id) : null;

  return (
    <div>
      {/* Head-to-head */}
      <div className="flex items-stretch gap-3 sm:gap-4 lg:gap-6">
        <PlayerSide
          player={player1}
          side="left"
          onVote={() => onVote(player1.id)}
          isVoting={isVoting}
          winner={winnerId}
          isWinner={winnerId === player1.id}
          isLoser={winnerId && winnerId !== player1.id}
        />

        {/* VS divider */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
            <span className="text-white font-black text-lg sm:text-xl">VS</span>
          </div>
        </div>

        <PlayerSide
          player={player2}
          side="right"
          onVote={() => onVote(player2.id)}
          isVoting={isVoting}
          winner={winnerId}
          isWinner={winnerId === player2.id}
          isLoser={winnerId && winnerId !== player2.id}
        />
      </div>

      {/* Skip button */}
      {!winnerId && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onSkip}
            disabled={isVoting}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Icon name="SkipForward" size={14} />
            Skip this matchup
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchupCard;
