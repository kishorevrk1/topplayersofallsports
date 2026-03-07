import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import SearchHeader from './components/SearchHeader';
import FilterChips from './components/FilterChips';
import SearchResults from './components/SearchResults';
import playerApiService from '../../services/playerApiService';

// Transform a PlayerSummary from the API into the shape PlayerCard expects.
const adaptPlayer = (p) => ({
  id: p.id,
  name: p.name,
  position: p.position || 'N/A',
  team: p.team || 'Unknown',
  nationality: p.nationality || '',
  sport: p.sport ? p.sport.toLowerCase() : 'unknown',
  avatar: p.photoUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
  coverImage: p.photoUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
  teamLogo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100',
  isVerified: true,
  isLive: false,
  achievements: p.currentRank ? `Rank #${p.currentRank}` : 'Ranked',
  rating: p.aiRating ? p.aiRating.toFixed(1) : 'N/A',
  trending: 0,
  stats: [
    { label: 'Rank', value: p.currentRank != null ? `#${p.currentRank}` : 'N/A' },
    { label: 'Rating', value: p.aiRating != null ? p.aiRating.toFixed(1) : 'N/A' },
    { label: 'Sport', value: p.sport || 'N/A' },
  ],
});

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Re-run search whenever URL query param or sport filter changes
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    if (!query.trim()) {
      setResults({});
      return;
    }
    performSearch(query, filters.sport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = async (query, sport) => {
    if (!query || !query.trim()) {
      setResults({});
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await playerApiService.searchPlayers(query.trim(), sport || '');
      const adapted = (data.players || []).map(adaptPlayer);
      setResults({
        players: adapted,
        news: [],
        videos: [],
        teams: [],
      });
    } catch (e) {
      setError(e.message || 'Search failed. Please try again.');
      setResults({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (newQuery) => {
    setSearchQuery(newQuery);
    performSearch(newQuery, filters.sport);
  };

  const handleFilterChange = (newFilters) => {
    const merged = { ...filters, ...newFilters };
    setFilters(merged);
    performSearch(searchQuery, merged.sport);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 pb-20 lg:pb-8">
        <SearchHeader
          onSearchChange={handleSearchChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <FilterChips onFilterChange={handleFilterChange} />

        <div className="px-4 lg:px-6 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <SearchResults
            searchQuery={searchQuery}
            filters={filters}
            results={results}
            isLoading={isLoading}
          />
        </div>
      </main>

      <TabNavigation />
    </div>
  );
};

export default SearchResultsPage;
