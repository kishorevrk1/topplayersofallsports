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
