import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import PlayerHero from './components/PlayerHero';
import PlayerTabs from './components/PlayerTabs';
import OverviewTab from './components/OverviewTab';
import StatsTab from './components/StatsTab';
import NewsTab from './components/NewsTab';
import VideosTab from './components/VideosTab';
import Breadcrumb from './components/Breadcrumb';
import SocialShare from './components/SocialShare';
import playerApiService from '../../services/playerApiService';

/**
 * Transform the flat backend player response into the shape the child components expect.
 */
function transformPlayer(raw) {
  const careerHighlights = Array.isArray(raw.careerHighlights)
    ? raw.careerHighlights.map((h, i) => ({
        title: typeof h === 'string' ? h : (h.title || `Highlight ${i + 1}`),
        description: typeof h === 'string' ? '' : (h.description || ''),
        date: typeof h === 'object' ? (h.date || '') : '',
        location: typeof h === 'object' ? (h.location || '') : '',
        icon: typeof h === 'object' ? (h.icon || 'Trophy') : 'Trophy',
      }))
    : [];

  const strengths = Array.isArray(raw.strengths) ? raw.strengths : [];

  return {
    id: raw.id,
    name: raw.displayName || raw.name,
    fullName: raw.name,
    sport: raw.sport || 'Unknown',
    team: {
      id: raw.team || 'unknown',
      name: raw.team || 'Unknown Club',
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.team || 'Team')}&size=100&background=random`,
    },
    jerseyNumber: raw.jerseyNumber || '—',
    position: raw.position || 'N/A',
    age: raw.age || null,
    height: raw.height || 'N/A',
    weight: raw.weight || 'N/A',
    status: raw.isActive ? 'Active' : 'Retired',
    image: raw.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(raw.name || 'Player')}&size=400&background=random`,
    dateOfBirth: raw.birthdate || '—',
    birthplace: raw.birthplace || '—',
    nationality: raw.nationality || '—',
    college: '—',
    currentRank: raw.currentRank,
    rankingScore: raw.rankingScore,
    aiRating: raw.aiRating,
    isActive: raw.isActive,
    biography: raw.biography || raw.analysisText || '',
    careerHighlights,
    strengths,
    achievements: careerHighlights.map(h => ({
      title: h.title,
      year: h.date || '—',
    })),
    keyStats: [
      { label: 'Rank', value: raw.currentRank ? `#${raw.currentRank}` : '—' },
      { label: 'Rating', value: raw.aiRating ?? raw.rankingScore ?? '—' },
      { label: 'Age', value: raw.age || '—' },
    ],
    seasonStats: {},
    careerStats: {},
    news: [],
    videos: [],
  };
}

const PlayerProfile = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const playerId = id || searchParams.get('id');

  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerId) {
      setError('No player ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.allSettled([
      playerApiService.getPlayerById(playerId),
      playerApiService.getPlayerStats(playerId),
    ]).then(([playerResult, statsResult]) => {
      if (playerResult.status === 'fulfilled') {
        const raw = playerResult.value;
        const transformed = transformPlayer(raw);

        // Merge real stats into player object if available
        if (statsResult.status === 'fulfilled' && statsResult.value) {
          transformed.seasonStats = statsResult.value.seasonStats || {};
          transformed.careerStats  = statsResult.value.careerStats  || {};
        }

        setPlayer(transformed);
      } else {
        setError(playerResult.reason?.message || 'Failed to load player');
      }
    }).finally(() => setLoading(false));
  }, [playerId]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'User' },
    { id: 'stats',    label: 'Stats',    icon: 'BarChart3' },
    { id: 'news',     label: 'News',     icon: 'Newspaper' },
    { id: 'videos',   label: 'Videos',   icon: 'Play' },
  ];

  const renderTabContent = () => {
    if (!player) return null;
    switch (activeTab) {
      case 'overview': return <OverviewTab player={player} />;
      case 'stats':    return <StatsTab    player={player} />;
      case 'news':     return <NewsTab     player={player} />;
      case 'videos':   return <VideosTab   player={player} />;
      default:         return <OverviewTab player={player} />;
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 pb-20 lg:pb-0 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading player profile...</p>
          </div>
        </div>
        <TabNavigation />
      </div>
    );
  }

  // Error / not found
  if (error || !player) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 pb-20 lg:pb-0 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">⚽</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Player Not Found</h2>
            <p className="text-text-secondary text-sm mb-6">
              {error || 'This player profile is not available yet.'}
            </p>
            <button
              onClick={() => navigate('/players')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse All Players
            </button>
          </div>
        </div>
        <TabNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-16 pb-20 lg:pb-0">
        <Breadcrumb player={player} />

        <PlayerHero
          player={player}
          onFollow={() => setIsFollowing(f => !f)}
          isFollowing={isFollowing}
        />

        <PlayerTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">

            {/* Main content */}
            <div className="lg:col-span-8">
              {renderTabContent()}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="sticky top-32 space-y-6">

                {/* Quick facts */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4 text-text-primary">Quick Facts</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Sport',       value: player.sport },
                      { label: 'Position',    value: player.position },
                      { label: 'Nationality', value: player.nationality },
                      { label: 'Age',         value: player.age ? `${player.age} years` : '—' },
                      { label: 'Height',      value: player.height },
                      { label: 'Weight',      value: player.weight },
                      { label: 'All-Time Rank', value: player.currentRank ? `#${player.currentRank}` : '—' },
                      { label: 'Status',      value: player.status },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-text-secondary">{label}</span>
                        <span className="font-medium text-text-primary">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4 text-text-primary">Quick Actions</h3>
                  <div className="space-y-3">
                    <SocialShare player={player} />
                    <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-150 text-sm">
                      <span>Add to Favorites</span>
                    </button>
                    <button
                      onClick={() => navigate(`/compare?p1=${playerId}`)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-150 text-sm"
                    >
                      <span>Compare Players</span>
                    </button>
                  </div>
                </div>

                {/* Strengths */}
                {player.strengths?.length > 0 && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="font-semibold mb-4 text-text-primary">Key Strengths</h3>
                    <ul className="space-y-2">
                      {player.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="text-accent mt-0.5">›</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>

      <TabNavigation />
    </div>
  );
};

export default PlayerProfile;
