import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';

/**
 * Renders a line chart of a player's ACR rating over time.
 *
 * @param {Array} history - array of rating history objects from GET /api/players/{id}/rating/history
 *   Each entry: { newScore, oldScore, changeReason, triggeredBy, createdAt }
 * @param {string} [className]
 */
export default function RatingHistoryChart({ history = [], className = '' }) {
  if (!history || history.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 text-sm ${className}`}>
        No rating history yet
      </div>
    );
  }

  // Build chart data in ascending order (oldest first)
  const chartData = [...history]
    .reverse()
    .map(entry => ({
      date: entry.createdAt ? format(parseISO(entry.createdAt), 'MMM d') : '—',
      rating: entry.newScore != null ? Math.round(entry.newScore * 10) / 10 : null,
      reason: REASON_LABELS[entry.changeReason] || entry.changeReason,
    }))
    .filter(d => d.rating != null);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const { rating, reason } = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 shadow-xl">
        <div className="font-semibold text-white">{label}</div>
        <div>Rating: <span className="text-blue-400 font-bold">{rating}</span></div>
        <div className="text-gray-400">{reason}</div>
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6, fill: '#60A5FA' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const REASON_LABELS = {
  INITIAL_SEED: 'Initial rating',
  SCHEDULED_REFRESH: 'Auto refresh',
  MANUAL_TRIGGER: 'Manual refresh',
  EVENT_DRIVEN: 'Event triggered',
};
