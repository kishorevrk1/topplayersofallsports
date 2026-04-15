import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from 'components/AppIcon';

const RoundTimer = ({ enabled, toggleEnabled, secondsLeft, progress, isUrgent, isCritical, matchNumber, maxMatches }) => {
  return (
    <div className="flex-1">
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
