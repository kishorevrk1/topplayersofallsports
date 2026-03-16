import React, { useEffect, useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import ConfidenceBadge from './ConfidenceBadge';

const CRITERIA = [
  { key: 'peakPerformance',    label: 'Peak Performance',    max: 30, description: 'Best season/tournament, records at peak' },
  { key: 'longevity',          label: 'Longevity',           max: 20, description: 'Years at elite level, consistency' },
  { key: 'awardsAndTitles',    label: 'Awards & Titles',     max: 20, description: 'Championships, MVPs, individual honours' },
  { key: 'eraAdjustedImpact',  label: 'Era-Adjusted Impact', max: 30, description: 'Dominance relative to peers & era' },
];

/**
 * Displays the full ACR (AI Consensus Rating) breakdown for a player.
 *
 * @param {object} breakdown - response from GET /api/players/{id}/rating/breakdown
 * @param {boolean} [loading]
 * @param {string}  [className]
 */
export default function RatingBreakdownCard({ breakdown, loading = false, className = '' }) {
  const [parsedCriteria, setParsedCriteria] = useState(null);
  const [parsedDataPoints, setParsedDataPoints] = useState([]);

  useEffect(() => {
    if (!breakdown) return;

    if (breakdown.criteriaBreakdown) {
      try {
        const parsed = typeof breakdown.criteriaBreakdown === 'string'
          ? JSON.parse(breakdown.criteriaBreakdown)
          : breakdown.criteriaBreakdown;
        setParsedCriteria(parsed);
      } catch {
        setParsedCriteria(null);
      }
    }

    if (breakdown.dataPointsCited) {
      try {
        const parsed = typeof breakdown.dataPointsCited === 'string'
          ? JSON.parse(breakdown.dataPointsCited)
          : breakdown.dataPointsCited;
        setParsedDataPoints(Array.isArray(parsed) ? parsed : []);
      } catch {
        setParsedDataPoints([]);
      }
    }
  }, [breakdown]);

  if (loading) {
    return (
      <div className={`rounded-xl bg-gray-800/50 border border-gray-700 p-5 animate-pulse ${className}`}>
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!breakdown || !breakdown.available) {
    return (
      <div className={`rounded-xl bg-gray-800/50 border border-gray-700 p-5 text-gray-400 text-sm ${className}`}>
        Rating breakdown not yet available.
      </div>
    );
  }

  const { consensusRating, confidenceLevel, divergenceScore, models, reasoning, caveats,
          generatedAt, stale } = breakdown;

  const freshnessText = generatedAt
    ? `Updated ${formatDistanceToNow(parseISO(generatedAt), { addSuffix: true })}`
    : null;

  return (
    <div className={`rounded-xl bg-gray-800/50 border border-gray-700 p-5 space-y-4 ${className}`}>

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">
            {consensusRating != null ? Math.round(consensusRating * 10) / 10 : '—'}
            <span className="text-sm font-normal text-gray-400"> / 100</span>
          </span>
          <ConfidenceBadge level={confidenceLevel} />
          {stale && (
            <span className="text-xs text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
              Refresh pending
            </span>
          )}
        </div>
        {freshnessText && (
          <span className="text-xs text-gray-500">{freshnessText}</span>
        )}
      </div>

      {/* Both model scores */}
      {models && (
        <div className="flex gap-4 text-xs text-gray-400 border-t border-gray-700/50 pt-3">
          <div>
            <span className="text-gray-500">
              {models.primary?.name?.split('/').pop() ?? 'Model 1'}:
            </span>{' '}
            <span className="text-white font-medium">{models.primary?.score}</span>
          </div>
          <div className="text-gray-600">·</div>
          <div>
            <span className="text-gray-500">
              {models.secondary?.name?.split('/').pop() ?? 'Model 2'}:
            </span>{' '}
            <span className="text-white font-medium">{models.secondary?.score}</span>
          </div>
          {divergenceScore != null && (
            <>
              <div className="text-gray-600">·</div>
              <div className="text-gray-500">Divergence: <span className="text-gray-300">{divergenceScore} pts</span></div>
            </>
          )}
        </div>
      )}

      {/* Criteria breakdown bars */}
      {parsedCriteria && (
        <div className="space-y-2.5 border-t border-gray-700/50 pt-3">
          {CRITERIA.map(({ key, label, max, description }) => {
            const value = parsedCriteria[key] ?? 0;
            const pct = Math.min((value / max) * 100, 100);
            return (
              <div key={key} title={description}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{label}</span>
                  <span className="text-gray-400 font-mono">{value}/{max}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Reasoning */}
      {reasoning && (
        <div className="border-t border-gray-700/50 pt-3 text-xs text-gray-400 leading-relaxed">
          <span className="text-gray-500 uppercase tracking-wide text-[10px] block mb-1">AI Reasoning</span>
          {reasoning}
        </div>
      )}

      {/* Data points cited */}
      {parsedDataPoints.length > 0 && (
        <div className="border-t border-gray-700/50 pt-3">
          <span className="text-gray-500 uppercase tracking-wide text-[10px] block mb-2">Evidence Cited</span>
          <ul className="space-y-1">
            {parsedDataPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="text-blue-500 mt-0.5 shrink-0">›</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Caveats */}
      {caveats && (
        <div className="border-t border-gray-700/50 pt-3 text-[11px] text-gray-500 italic">
          Note: {caveats}
        </div>
      )}
    </div>
  );
}
