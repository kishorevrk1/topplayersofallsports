import React, { useState } from 'react';

const CONFIDENCE_CONFIG = {
  HIGH: {
    label: 'HIGH',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    dot: 'bg-emerald-400',
    tooltip: 'Both AI models agreed within 3 points — strong consensus',
  },
  MEDIUM: {
    label: 'MEDIUM',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    dot: 'bg-amber-400',
    tooltip: 'Models diverged 3–6 points — moderate consensus',
  },
  LOW: {
    label: 'LOW',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    dot: 'bg-orange-400',
    tooltip: 'Models diverged more than 6 points — rating may need review',
  },
};

/**
 * Displays an ACR confidence badge (HIGH / MEDIUM / LOW).
 * Shows a tooltip on hover explaining what the confidence level means.
 *
 * @param {string} level - "HIGH" | "MEDIUM" | "LOW"
 * @param {string} [className] - optional extra classes
 */
const SIZE_CLASSES = {
  xs: 'gap-1 px-1.5 py-0 text-[10px]',
  sm: 'gap-1 px-1.5 py-0.5 text-xs',
  md: 'gap-1.5 px-2 py-0.5 text-xs',
};

const DOT_SIZES = {
  xs: 'w-1 h-1',
  sm: 'w-1.5 h-1.5',
  md: 'w-1.5 h-1.5',
};

export default function ConfidenceBadge({ level, className = '', size = 'md' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cfg = CONFIDENCE_CONFIG[level] || CONFIDENCE_CONFIG.LOW;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const dotSize = DOT_SIZES[size] || DOT_SIZES.md;

  return (
    <div
      className={`relative inline-flex items-center rounded-full border font-medium cursor-help ${sizeClass} ${cfg.color} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`rounded-full ${dotSize} ${cfg.dot}`} />
      {cfg.label}

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 text-center
                        px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-gray-300 text-xs
                        shadow-xl pointer-events-none">
          {cfg.tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
