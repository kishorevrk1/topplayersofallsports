import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import SearchInterface from '../../components/ui/SearchInterface';
import ContentFilterBar from '../../components/ui/ContentFilterBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Image from '../../components/AppImage';
import Icon from '../../components/AppIcon';

const PlayersDirectory = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortBy, setSortBy] = useState('overall');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  // Comprehensive mock players data
  const mockPlayersData = {
    nba: [
      {
        id: 1,
        name: "LeBron James",
        position: "SF/PF",
        team: "Los Angeles Lakers",
        sport: "NBA",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          ppg: 25.3,
          rpg: 7.3,
          apg: 7.4,
          fg: "50.3%"
        },
        attributes: {
          overall: 97,
          offense: 95,
          defense: 89,
          athleticism: 92
        },
        age: 39,
        experience: "21 seasons",
        trending: "+12%",
        contract: "$97.1M (2024-2025)",
        nationality: "USA",
        height: "6'9\"",
        weight: "250 lbs"
      },
      {
        id: 2,
        name: "Giannis Antetokounmpo",
        position: "PF/C",
        team: "Milwaukee Bucks",
        sport: "NBA",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          ppg: 31.1,
          rpg: 11.8,
          apg: 5.7,
          fg: "55.3%"
        },
        attributes: {
          overall: 97,
          offense: 94,
          defense: 95,
          athleticism: 99
        },
        age: 29,
        experience: "11 seasons",
        trending: "+15%",
        contract: "$228.2M (2021-2026)",
        nationality: "Greece",
        height: "6'11\"",
        weight: "242 lbs"
      },
      {
        id: 3,
        name: "Stephen Curry",
        position: "PG",
        team: "Golden State Warriors",
        sport: "NBA",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          ppg: 29.5,
          rpg: 6.1,
          apg: 6.3,
          fg: "42.7%"
        },
        attributes: {
          overall: 96,
          offense: 99,
          defense: 78,
          athleticism: 86
        },
        age: 36,
        experience: "15 seasons",
        trending: "+18%",
        contract: "$215.4M (2021-2026)",
        nationality: "USA",
        height: "6'2\"",
        weight: "185 lbs"
      }
    ],
    nfl: [
      {
        id: 4,
        name: "Josh Allen",
        position: "QB",
        team: "Buffalo Bills",
        sport: "NFL",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          passYards: 4306,
          touchdowns: 29,
          completion: "68.4%",
          rating: 92.2
        },
        attributes: {
          overall: 95,
          throwing: 94,
          mobility: 89,
          leadership: 96
        },
        age: 28,
        experience: "6 seasons",
        trending: "+8%",
        contract: "$258M (2021-2028)",
        nationality: "USA",
        height: "6'5\"",
        weight: "237 lbs"
      },
      {
        id: 5,
        name: "Patrick Mahomes",
        position: "QB",
        team: "Kansas City Chiefs",
        sport: "NFL",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          passYards: 4839,
          touchdowns: 37,
          completion: "69.3%",
          rating: 105.2
        },
        attributes: {
          overall: 99,
          throwing: 97,
          mobility: 90,
          leadership: 98
        },
        age: 29,
        experience: "7 seasons",
        trending: "+15%",
        contract: "$450M (2022-2031)",
        nationality: "USA",
        height: "6'3\"",
        weight: "230 lbs"
      }
    ],
    mlb: [
      {
        id: 6,
        name: "Aaron Judge",
        position: "OF",
        team: "New York Yankees",
        sport: "MLB",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          avg: .311,
          homeRuns: 62,
          rbi: 131,
          ops: 1.111
        },
        attributes: {
          overall: 94,
          hitting: 96,
          fielding: 89,
          speed: 82
        },
        age: 31,
        experience: "8 seasons",
        trending: "+20%",
        contract: "$360M (2023-2031)",
        nationality: "USA",
        height: "6'7\"",
        weight: "282 lbs"
      },
      {
        id: 7,
        name: "Mike Trout",
        position: "OF",
        team: "Los Angeles Angels",
        sport: "MLB",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          avg: .283,
          homeRuns: 40,
          rbi: 104,
          ops: .999
        },
        attributes: {
          overall: 96,
          hitting: 95,
          fielding: 92,
          speed: 90
        },
        age: 33,
        experience: "13 seasons",
        trending: "+12%",
        contract: "$426.5M (2019-2030)",
        nationality: "USA",
        height: "6'2\"",
        weight: "235 lbs"
      }
    ],
    soccer: [
      {
        id: 8,
        name: "Erling Haaland",
        position: "ST",
        team: "Manchester City",
        sport: "Soccer",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          goals: 36,
          assists: 8,
          shots: 142,
          accuracy: "89%"
        },
        attributes: {
          overall: 91,
          pace: 89,
          shooting: 94,
          dribbling: 80
        },
        age: 24,
        experience: "6 seasons",
        trending: "+25%",
        contract: "£375k/week (2022-2027)",
        nationality: "Norway",
        height: "6'4\"",
        weight: "194 lbs"
      }
    ]
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const allPlayers = Object.values(mockPlayersData).flat();
      setPlayers(allPlayers);
      setLoading(false);
    }, 800);
  }, []);

  // Filtering and sorting logic
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.sport.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(player => 
        player.sport.toLowerCase() === selectedSport.toLowerCase()
      );
    }

    // Apply position filter
    if (selectedPosition !== 'all') {
      filtered = filtered.filter(player => 
        player.position.toLowerCase().includes(selectedPosition.toLowerCase())
      );
    }

    // Apply team filter
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(player => 
        player.team.toLowerCase().includes(selectedTeam.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'overall':
          aValue = a.attributes.overall;
          bValue = b.attributes.overall;
          break;
        case 'age':
          aValue = a.age;
          bValue = b.age;
          break;
        case 'team':
          aValue = a.team.toLowerCase();
          bValue = b.team.toLowerCase();
          break;
        default:
          aValue = a.attributes.overall;
          bValue = b.attributes.overall;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [players, searchQuery, selectedSport, selectedPosition, selectedTeam, sortBy, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlayers = filteredAndSortedPlayers.slice(startIndex, endIndex);

  // Get unique values for filter dropdowns
  const availableSports = ['all', ...new Set(players.map(p => p.sport))];
  const availablePositions = ['all', ...new Set(players.map(p => p.position))];
  const availableTeams = ['all', ...new Set(players.map(p => p.team))];

  const getStatDisplay = (player) => {
    const stats = player.stats;
    if (stats.ppg) return `${stats.ppg} PPG`;
    if (stats.passYards) return `${stats.passYards} YDS`;
    if (stats.goals) return `${stats.goals} Goals`;
    if (stats.avg) return `.${Math.round(stats.avg * 1000)} AVG`;
    return 'N/A';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20 lg:pb-8">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Players Directory
            </h1>
            <p className="text-text-secondary">
              Discover and explore top players from all sports
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg border border-border p-6 mb-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Icon name="Search" size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search players, teams, positions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 w-full"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <Icon name="X" size={14} />
                  </Button>
                )}
              </div>
            </div>

            {/* Filters Toggle */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Icon name="Filter" size={16} />
                <span>Filters</span>
                <Icon name={showFilters ? "ChevronUp" : "ChevronDown"} size={16} />
              </Button>

              <div className="flex items-center space-x-3">
                {/* Sort */}
                <Select
                  value={sortBy}
                  onChange={(value) => setSortBy(value)}
                  options={[
                    { value: 'overall', label: 'Overall Rating' },
                    { value: 'name', label: 'Name' },
                    { value: 'age', label: 'Age' },
                    { value: 'team', label: 'Team' }
                  ]}
                  className="w-40"
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  <Icon name={sortDirection === 'asc' ? "ArrowUp" : "ArrowDown"} size={16} />
                </Button>

                {/* View Mode */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    <Icon name="Grid3x3" size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <Icon name="List" size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Sport
                  </label>
                  <Select
                    value={selectedSport}
                    onChange={(value) => {
                      setSelectedSport(value);
                      setCurrentPage(1);
                    }}
                    options={availableSports.map(sport => ({
                      value: sport,
                      label: sport === 'all' ? 'All Sports' : sport.toUpperCase()
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Position
                  </label>
                  <Select
                    value={selectedPosition}
                    onChange={(value) => {
                      setSelectedPosition(value);
                      setCurrentPage(1);
                    }}
                    options={availablePositions.map(position => ({
                      value: position,
                      label: position === 'all' ? 'All Positions' : position
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Team
                  </label>
                  <Select
                    value={selectedTeam}
                    onChange={(value) => {
                      setSelectedTeam(value);
                      setCurrentPage(1);
                    }}
                    options={availableTeams.slice(0, 10).map(team => ({
                      value: team,
                      label: team === 'all' ? 'All Teams' : team
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-text-secondary">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPlayers.length)} of {filteredAndSortedPlayers.length} players
              {searchQuery && (
                <span className="ml-2">
                  for "<span className="font-medium text-text-primary">{searchQuery}</span>"
                </span>
              )}
            </div>
            <div className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {/* Players Grid/List */}
          {filteredAndSortedPlayers.length === 0 ? (
            <div className="text-center py-16">
              <Icon name="Users" size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Players Found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search criteria or filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSport('all');
                  setSelectedPosition('all');
                  setSelectedTeam('all');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentPlayers.map((player) => (
                <Link
                  key={player.id}
                  to={`/player-profile/${player.id}`}
                  className="group bg-white rounded-lg border border-border p-6 hover:shadow-lg transition-all duration-200 hover:border-primary"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={player.avatar}
                          alt={player.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        <Image
                          src={player.teamLogo}
                          alt={player.team}
                          className="w-6 h-6 rounded-full absolute -bottom-1 -right-1 border-2 border-white"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary group-hover:text-primary transition-colors">
                          {player.name}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {player.position} • {player.sport}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {player.team}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-success">
                      <Icon name="TrendingUp" size={14} />
                      <span className="text-xs font-medium">{player.trending}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">Overall Rating</span>
                      <span className="text-sm font-bold">{player.attributes.overall}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${player.attributes.overall}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Primary Stat</span>
                      <span className="font-medium text-text-primary">
                        {getStatDisplay(player)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-text-secondary">Age</span>
                      <span className="font-medium text-text-primary">{player.age} years</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overall
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPlayers.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Image
                                src={player.avatar}
                                alt={player.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <Image
                                src={player.teamLogo}
                                alt={player.team}
                                className="w-5 h-5 rounded-full absolute -bottom-1 -right-1 border-2 border-white"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-text-primary">{player.name}</div>
                              <div className="text-xs text-text-secondary">{player.experience}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-primary">{player.sport}</td>
                        <td className="px-6 py-4 text-sm text-text-primary">{player.position}</td>
                        <td className="px-6 py-4 text-sm text-text-primary">{player.team}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold">{player.attributes.overall}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${player.attributes.overall}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-primary">{player.age}</td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/player-profile/${player.id}`}
                            className="text-primary hover:text-primary-dark text-sm font-medium"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <div className="text-sm text-text-secondary">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPlayers.length)} of {filteredAndSortedPlayers.length} players
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2"
                >
                  <Icon name="ChevronLeft" size={16} />
                  <span>Previous</span>
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-gray-400">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <Icon name="ChevronRight" size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <TabNavigation />
    </div>
  );
};

export default PlayersDirectory;
