import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import playerApiService from '../../services/playerApiService';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import Icon from '../../components/AppIcon';
import Image from '../../components/AppImage';

const CRITERIA = [
  { key: 'peakPerformance', label: 'Peak Performance', max: 30 },
  { key: 'longevity', label: 'Longevity', max: 20 },
  { key: 'awardsAndTitles', label: 'Awards & Titles', max: 20 },
  { key: 'eraAdjustedImpact', label: 'Era-Adjusted Impact', max: 30 },
];

function parseCriteria(json) {
  try {
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

function CriteriaBar({ label, value, max, isWinner }) {
  const pct = Math.min(100, ((value || 0) / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-secondary">
        <span>{label}</span>
        <span className={isWinner ? 'text-accent font-semibold' : ''}>
          {value != null ? value.toFixed(1) : '—'} / {max}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isWinner ? 'bg-accent' : 'bg-primary/60'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PlayerColumn({ snapshot, isWinner }) {
  if (!snapshot) return null;
  const criteria = parseCriteria(snapshot.criteriaBreakdown);

  return (
    <div className={`flex-1 rounded-xl border p-6 space-y-6 transition-all ${isWinner ? 'border-accent/60 bg-accent/5' : 'border-border bg-card'}`}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="relative w-24 h-24 mx-auto">
          <Image
            src={snapshot.photoUrl || '/assets/images/no_image.png'}
            alt={snapshot.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-border"
          />
          {isWinner && (
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-accent rounded-full flex items-center justify-center">
              <Icon name="Trophy" size={14} className="text-white" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{snapshot.displayName || snapshot.name}</h2>
          <p className="text-sm text-text-secondary">{snapshot.position} · {snapshot.team || snapshot.nationality}</p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs bg-muted px-2 py-1 rounded-full">{snapshot.sport}</span>
          {snapshot.isActive && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">Active</span>}
        </div>
      </div>

      {/* ACR Score */}
      <div className="text-center border-t border-border pt-4">
        <div className="text-4xl font-bold text-text-primary">
          {snapshot.consensusScore != null ? snapshot.consensusScore.toFixed(1) : '—'}
        </div>
        <div className="text-xs text-text-secondary mt-1">ACR Consensus Score</div>
        {snapshot.confidenceLevel && (
          <div className="flex justify-center mt-2">
            <ConfidenceBadge level={snapshot.confidenceLevel} />
          </div>
        )}
      </div>

      {/* Model Scores */}
      {(snapshot.model1Score != null || snapshot.model2Score != null) && (
        <div className="grid grid-cols-2 gap-3 text-center border-t border-border pt-4">
          <div>
            <div className="text-lg font-semibold text-text-primary">
              {snapshot.model1Score?.toFixed(1) ?? '—'}
            </div>
            <div className="text-xs text-text-secondary">Model 1</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-text-primary">
              {snapshot.model2Score?.toFixed(1) ?? '—'}
            </div>
            <div className="text-xs text-text-secondary">Model 2</div>
          </div>
        </div>
      )}

      {/* Criteria Bars */}
      {Object.keys(criteria).length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-text-primary">Criteria Breakdown</h4>
          {CRITERIA.map(({ key, label, max }) => (
            <CriteriaBar key={key} label={label} value={criteria[key]} max={max} isWinner={isWinner} />
          ))}
        </div>
      )}

      {/* Link to profile */}
      <Link
        to={`/player-profile/${snapshot.id}`}
        className="block text-center text-sm text-accent hover:underline"
      >
        View Full Profile →
      </Link>
    </div>
  );
}

export default function PlayerComparisonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const p1Id = searchParams.get('p1');
  const p2Id = searchParams.get('p2');
  const [p2Input, setP2Input] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!p1Id || !p2Id) return;
    setLoading(true);
    setError(null);
    playerApiService.comparePlayer(p1Id, p2Id)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [p1Id, p2Id]);

  const handleP2Submit = (e) => {
    e.preventDefault();
    const val = p2Input.trim();
    if (!val) return;
    navigate(`/compare?p1=${p1Id}&p2=${val}`);
  };

  // Determine winner
  const s1 = data?.player1?.consensusScore;
  const s2 = data?.player2?.consensusScore;
  const p1Wins = s1 != null && s2 != null && s1 > s2;
  const p2Wins = s1 != null && s2 != null && s2 > s1;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Player Comparison</h1>
        </div>

        {/* Need p2 */}
        {p1Id && !p2Id && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <p className="text-text-secondary">
              Enter the ID of the second player to compare against{' '}
              <strong className="text-text-primary">Player #{p1Id}</strong>.
            </p>
            <form onSubmit={handleP2Submit} className="flex gap-3">
              <input
                type="number"
                value={p2Input}
                onChange={e => setP2Input(e.target.value)}
                placeholder="Player ID (e.g. 2)"
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                Compare
              </button>
            </form>
            <p className="text-xs text-text-secondary">
              Tip: You can find player IDs from the{' '}
              <Link to="/players" className="text-accent hover:underline">Players Directory</Link>.
            </p>
          </div>
        )}

        {/* Need p1 */}
        {!p1Id && (
          <div className="text-center py-16 text-text-secondary">
            <Icon name="Users" size={40} className="mx-auto mb-4 opacity-40" />
            <p>Open this page from a player profile to start a comparison.</p>
            <Link to="/players" className="mt-4 inline-block text-accent hover:underline">
              Browse Players
            </Link>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="animate-spin text-text-secondary" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
            <div className="flex items-center gap-2 font-semibold">
              <Icon name="AlertCircle" size={18} />
              Failed to load comparison
            </div>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Comparison */}
        {data && !loading && (
          <>
            {/* Winner banner */}
            {(p1Wins || p2Wins) && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
                <Icon name="Trophy" size={20} className="text-accent" />
                <span className="font-semibold text-text-primary">
                  {p1Wins ? (data.player1.displayName || data.player1.name) : (data.player2.displayName || data.player2.name)}{' '}
                  wins with a higher ACR score
                  {' '}({p1Wins ? s1.toFixed(1) : s2.toFixed(1)} vs {p1Wins ? s2.toFixed(1) : s1.toFixed(1)})
                </span>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
              <PlayerColumn snapshot={data.player1} isWinner={p1Wins} />
              <div className="hidden md:flex items-center justify-center text-2xl font-bold text-text-secondary px-2">
                VS
              </div>
              <PlayerColumn snapshot={data.player2} isWinner={p2Wins} />
            </div>

            {/* Share */}
            <div className="text-center">
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
              >
                <Icon name="Share2" size={14} />
                Copy comparison link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
