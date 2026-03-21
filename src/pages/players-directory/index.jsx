import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Image from '../../components/AppImage';
import Icon from '../../components/AppIcon';
import playerApiService from '../../services/playerApiService';

const SPORTS = [
  { key: 'FOOTBALL',   label: 'Football',   icon: '⚽' },
  { key: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { key: 'MMA',        label: 'MMA',        icon: '🥊' },
  { key: 'CRICKET',    label: 'Cricket',    icon: '🏏' },
  { key: 'TENNIS',     label: 'Tennis',     icon: '🎾' },
];

const ITEMS_PER_PAGE = 20;

const getRatingColor = (rating) => {
  if (rating >= 90) return 'text-emerald-500';
  if (rating >= 80) return 'text-blue-500';
  if (rating >= 70) return 'text-yellow-500';
  return 'text-gray-400';
};

const PlayersDirectory = () => {
  const [selectedSport, setSelectedSport] = useState('FOOTBALL');
  const [players, setPlayers]             = useState([]);
  const [meta, setMeta]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [sortBy, setSortBy]               = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode]           = useState('cards');
  const [currentPage, setCurrentPage]     = useState(1);

  // Fetch top 100 whenever sport tab changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    playerApiService.getTop100BySport(selectedSport)
      .then(data => {
        if (cancelled) return;
        setPlayers(data.players || []);
        setMeta({ title: data.title, subtitle: data.subtitle, count: data.count });
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setPlayers([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedSport]);

  // Filter + sort
  const processed = useMemo(() => {
    let list = [...players];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.displayName || '').toLowerCase().includes(q) ||
        (p.team || '').toLowerCase().includes(q) ||
        (p.position || '').toLowerCase().includes(q) ||
        (p.nationality || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let av, bv;
      switch (sortBy) {
        case 'name':   av = (a.displayName || a.name || '').toLowerCase(); bv = (b.displayName || b.name || '').toLowerCase(); break;
        case 'rating': av = a.aiRating ?? a.rating ?? 0; bv = b.aiRating ?? b.rating ?? 0; break;
        case 'elo':    av = a.eloScore ?? 0; bv = b.eloScore ?? 0; break;
        case 'age':    av = a.age ?? 0; bv = b.age ?? 0; break;
        default:       av = a.rank ?? 999; bv = b.rank ?? 999; break;
      }
      if (sortDirection === 'asc') return av > bv ? 1 : av < bv ? -1 : 0;
      return av < bv ? 1 : av > bv ? -1 : 0;
    });

    return list;
  }, [players, searchQuery, sortBy, sortDirection]);

  const totalPages  = Math.ceil(processed.length / ITEMS_PER_PAGE);
  const pageStart   = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagePlayers = processed.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20 lg:pb-8">
          <div className="container mx-auto px-4 py-8 animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-72" />
            <div className="flex gap-3">
              {SPORTS.map(s => <div key={s.key} className="h-10 bg-gray-200 rounded-full w-28" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <div key={i} className="h-56 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        </main>
        <TabNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-1">Top 100 All-Time Greatest</h1>
            <p className="text-text-secondary text-sm">
              {meta?.subtitle || 'Historical rankings up to 2025 · AI Consensus Rating (ACR)'}
            </p>
          </div>

          {/* Sport tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {SPORTS.map(sport => (
              <button
                key={sport.key}
                onClick={() => setSelectedSport(sport.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-150 border
                  ${selectedSport === sport.key
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-card border-border text-text-secondary hover:border-primary hover:text-primary'
                  }`}
              >
                <span>{sport.icon}</span>
                {sport.label}
                {selectedSport === sport.key && meta?.count > 0 && (
                  <span className="ml-1 bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {meta.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Controls bar */}
          <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm w-full">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, team, position..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={sortBy}
                onChange={v => { setSortBy(v); setCurrentPage(1); }}
                options={[
                  { value: 'rank',   label: 'By Rank' },
                  { value: 'rating', label: 'By Rating' },
                  { value: 'elo',    label: 'By ELO' },
                  { value: 'name',   label: 'By Name' },
                  { value: 'age',    label: 'By Age' },
                ]}
                className="w-36"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                <Icon name={sortDirection === 'asc' ? 'ArrowUp' : 'ArrowDown'} size={14} />
              </Button>
              <div className="flex gap-1 border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-card text-text-secondary hover:bg-muted'}`}
                >
                  <Icon name="Grid3x3" size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-card text-text-secondary hover:bg-muted'}`}
                >
                  <Icon name="List" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          {!error && (
            <div className="text-sm text-text-secondary mb-4">
              Showing {Math.min(pageStart + 1, processed.length)}–{Math.min(pageStart + ITEMS_PER_PAGE, processed.length)} of {processed.length} players
              {searchQuery && (
                <span> for "<span className="text-text-primary font-medium">{searchQuery}</span>"</span>
              )}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <Icon name="AlertCircle" size={40} className="mx-auto text-red-400 mb-3" />
              <p className="text-red-600 font-semibold text-lg mb-1">Could not load players</p>
              <p className="text-red-500 text-sm mb-1">{error}</p>
              <p className="text-red-400 text-xs">Make sure the player-service is running on port 8084</p>
            </div>
          )}

          {/* Empty state */}
          {!error && processed.length === 0 && (
            <div className="text-center py-20">
              <Icon name="Users" size={56} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Players Found</h3>
              <p className="text-text-secondary text-sm mb-4">
                {searchQuery
                  ? 'Try a different search term.'
                  : `${SPORTS.find(s => s.key === selectedSport)?.label} data hasn't been seeded yet.`
                }
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
              )}
            </div>
          )}

          {/* Cards view */}
          {!error && processed.length > 0 && viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {pagePlayers.map(player => {
                const rating = player.aiRating ?? player.rating ?? 0;
                return (
                  <Link
                    key={player.id}
                    to={`/player-profile/${player.id}`}
                    className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/50 transition-all duration-200 flex flex-col gap-3"
                  >
                    {/* Rank + status row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary bg-muted px-2.5 py-0.5 rounded-full">
                        #{player.rank}
                      </span>
                      {player.isActive ? (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          Legend
                        </span>
                      )}
                    </div>

                    {/* Avatar + identity */}
                    <div className="flex items-center gap-3">
                      <Image
                        src={player.photoUrl}
                        alt={player.displayName || player.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-border shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors truncate text-sm">
                          {player.displayName || player.name}
                        </h3>
                        <p className="text-xs text-text-secondary truncate">{player.position}</p>
                        <p className="text-xs text-text-secondary">{player.nationality}</p>
                      </div>
                    </div>

                    {/* Rating + ELO */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary">Rating</span>
                          <span className={`font-bold tabular-nums ${getRatingColor(rating)}`}>{rating}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden w-24">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700"
                            style={{ width: `${Math.min(rating, 100)}%` }}
                          />
                        </div>
                      </div>
                      {player.eloScore != null && (
                        <div className="bg-muted px-2.5 py-1 rounded-lg text-center">
                          <div className="text-[10px] text-text-secondary leading-none">ELO</div>
                          <div className="text-sm font-bold text-accent tabular-nums">{player.eloScore}</div>
                        </div>
                      )}
                    </div>

                    {/* Bio snippet */}
                    {player.biography && (
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {player.biography}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* List view */}
          {!error && processed.length > 0 && viewMode === 'list' && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {['Rank', 'Player', 'Position', 'Nationality', 'Age', 'Rating', 'ELO', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pagePlayers.map(player => {
                      const rating = player.aiRating ?? player.rating ?? 0;
                      return (
                        <tr key={player.id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-text-secondary text-xs">#{player.rank}</td>
                          <td className="px-4 py-3">
                            <Link to={`/player-profile/${player.id}`} className="flex items-center gap-3 group">
                              <Image
                                src={player.photoUrl}
                                alt={player.displayName || player.name}
                                className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                              />
                              <span className="font-medium text-text-primary group-hover:text-primary transition-colors whitespace-nowrap">
                                {player.displayName || player.name}
                              </span>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{player.position || '—'}</td>
                          <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{player.nationality || '—'}</td>
                          <td className="px-4 py-3 text-text-secondary">{player.age || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold tabular-nums text-sm ${getRatingColor(rating)}`}>{rating}</span>
                              <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(rating, 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold tabular-nums text-sm text-accent">{player.eloScore ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {player.isActive
                              ? <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Active</span>
                              : <span className="text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Legend</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline" size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <Icon name="ChevronLeft" size={14} />
              </Button>

              {[...Array(Math.min(7, totalPages))].map((_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 7 && <span className="text-gray-400 text-sm px-1">…</span>}

              <Button
                variant="outline" size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <Icon name="ChevronRight" size={14} />
              </Button>
            </div>
          )}

        </div>
      </main>

      <TabNavigation />
    </div>
  );
};

export default PlayersDirectory;
