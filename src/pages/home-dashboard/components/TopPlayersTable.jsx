import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import playerApiService from '../../../services/playerApiService';

const TopPlayersTable = ({ selectedCategory = 'all' }) => {
  const [playersData, setPlayersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('overall');
  const [sortDirection, setSortDirection] = useState('desc');

  const itemsPerPage = 10; // Fixed at 10 items per page
  const [error, setError] = useState(null);

  // Map frontend categories to backend sport enums
  const categoryToSport = {
    'all': null,
    'football': 'FOOTBALL',
    'basketball': 'BASKETBALL',
    'cricket': 'CRICKET',
    'tennis': 'TENNIS',
    'mma': 'MMA'
  };

  // Legacy mock data for fallback
  const mockPlayersData = {
    nba: [
      {
        id: 1,
        name: "LeBron James",
        position: "SF/PF",
        team: "Los Angeles Lakers",
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
        recentNews: "Breaks all-time scoring record with historic performance",
        upcomingMatch: {
          opponent: "Golden State Warriors",
          date: "2025-07-28",
          time: "20:00",
          venue: "Crypto.com Arena"
        },
        lastMatch: {
          opponent: "Oklahoma City Thunder",
          score: "133-130 (OT)",
          performance: "38 PTS, 7 REB, 6 AST",
          date: "2025-07-24"
        },
        contract: "$97.1M (2024-2025)",
        age: 39,
        experience: "21 seasons",
        trending: "+12%"
      },
      {
        id: 2,
        name: "Giannis Antetokounmpo",
        position: "PF/C",
        team: "Milwaukee Bucks",
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
        recentNews: "Dominates with 50-point triple-double performance",
        upcomingMatch: {
          opponent: "Miami Heat",
          date: "2025-07-29",
          time: "19:30",
          venue: "Fiserv Forum"
        },
        lastMatch: {
          opponent: "Brooklyn Nets",
          score: "128-119",
          performance: "44 PTS, 14 REB, 7 AST",
          date: "2025-07-25"
        },
        contract: "$228.2M (2021-2026)",
        age: 29,
        experience: "11 seasons",
        trending: "+15%"
      },
      {
        id: 3,
        name: "Stephen Curry",
        position: "PG",
        team: "Golden State Warriors",
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
        recentNews: "Sets new three-point record in spectacular fashion",
        upcomingMatch: {
          opponent: "Los Angeles Lakers",
          date: "2025-07-28",
          time: "20:00",
          venue: "Chase Center"
        },
        lastMatch: {
          opponent: "Phoenix Suns",
          score: "118-112",
          performance: "35 PTS, 8 3PM, 5 AST",
          date: "2025-07-25"
        },
        contract: "$215.4M (2021-2026)",
        age: 36,
        experience: "15 seasons",
        trending: "+18%"
      },
      {
        id: 4,
        name: "Jayson Tatum",
        position: "SF",
        team: "Boston Celtics",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          ppg: 26.9,
          rpg: 8.0,
          apg: 4.9,
          fg: "45.0%"
        },
        attributes: {
          overall: 93,
          offense: 94,
          defense: 85,
          athleticism: 90
        },
        recentNews: "Leads Celtics to Championship with Finals MVP performance",
        upcomingMatch: {
          opponent: "Philadelphia 76ers",
          date: "2025-07-30",
          time: "19:00",
          venue: "TD Garden"
        },
        lastMatch: {
          opponent: "Miami Heat",
          score: "110-102",
          performance: "31 PTS, 9 REB, 6 AST",
          date: "2025-07-26"
        },
        contract: "$163M (2024-2029)",
        age: 26,
        experience: "7 seasons",
        trending: "+22%"
      },
      {
        id: 5,
        name: "Luka Doncic",
        position: "PG/SG",
        team: "Dallas Mavericks",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          ppg: 32.4,
          rpg: 8.6,
          apg: 9.0,
          fg: "45.7%"
        },
        attributes: {
          overall: 96,
          offense: 96,
          defense: 80,
          athleticism: 83
        },
        recentNews: "Triple-double machine leads Mavs to playoffs",
        upcomingMatch: {
          opponent: "Denver Nuggets",
          date: "2025-07-31",
          time: "21:00",
          venue: "American Airlines Center"
        },
        lastMatch: {
          opponent: "Utah Jazz",
          score: "125-120",
          performance: "43 PTS, 11 REB, 12 AST",
          date: "2025-07-26"
        },
        contract: "$207M (2022-2027)",
        age: 25,
        experience: "6 seasons",
        trending: "+25%"
      },
      {
        id: 6,
        name: "Nikola Jokic",
        position: "C",
        team: "Denver Nuggets",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          ppg: 24.5,
          rpg: 11.8,
          apg: 9.8,
          fg: "58.3%"
        },
        attributes: {
          overall: 97,
          offense: 92,
          defense: 88,
          athleticism: 85
        },
        recentNews: "Back-to-back MVP leads Nuggets to championship",
        upcomingMatch: {
          opponent: "Dallas Mavericks",
          date: "2025-07-31",
          time: "21:00",
          venue: "Ball Arena"
        },
        lastMatch: {
          opponent: "Portland Trail Blazers",
          score: "132-126",
          performance: "26 PTS, 15 REB, 11 AST",
          date: "2025-07-26"
        },
        contract: "$264M (2022-2028)",
        age: 29,
        experience: "9 seasons",
        trending: "+20%"
      }
    ],
    nfl: [
      {
        id: 1,
        name: "Josh Allen",
        position: "QB",
        team: "Buffalo Bills",
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
        recentNews: "Leads Bills to AFC Championship with clutch performance",
        upcomingMatch: {
          opponent: "Kansas City Chiefs",
          date: "2025-08-02",
          time: "16:00",
          venue: "Arrowhead Stadium"
        },
        lastMatch: {
          opponent: "Miami Dolphins",
          score: "31-17",
          performance: "304 YDS, 3 TD, 1 INT",
          date: "2025-07-26"
        },
        contract: "$258M (2021-2028)",
        age: 28,
        experience: "6 seasons",
        trending: "+8%"
      },
      {
        id: 2,
        name: "Patrick Mahomes",
        position: "QB",
        team: "Kansas City Chiefs",
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
        recentNews: "MVP performance leads Chiefs to Super Bowl victory",
        upcomingMatch: {
          opponent: "Buffalo Bills",
          date: "2025-08-02",
          time: "16:00",
          venue: "Arrowhead Stadium"
        },
        lastMatch: {
          opponent: "Las Vegas Raiders",
          score: "28-14",
          performance: "335 YDS, 4 TD, 0 INT",
          date: "2025-07-26"
        },
        contract: "$450M (2022-2031)",
        age: 29,
        experience: "7 seasons",
        trending: "+15%"
      },
      {
        id: 3,
        name: "Aaron Rodgers",
        position: "QB",
        team: "New York Jets",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          passYards: 4115,
          touchdowns: 32,
          completion: "64.5%",
          rating: 98.7
        },
        attributes: {
          overall: 94,
          throwing: 99,
          mobility: 82,
          leadership: 95
        },
        recentNews: "Veteran quarterback leads Jets resurgence",
        upcomingMatch: {
          opponent: "New England Patriots",
          date: "2025-08-01",
          time: "13:00",
          venue: "MetLife Stadium"
        },
        lastMatch: {
          opponent: "Indianapolis Colts",
          score: "24-17",
          performance: "289 YDS, 2 TD, 1 INT",
          date: "2025-07-25"
        },
        contract: "$112.5M (2023-2026)",
        age: 41,
        experience: "19 seasons",
        trending: "+5%"
      }
    ],
    mlb: [
      {
        id: 1,
        name: "Aaron Judge",
        position: "OF",
        team: "New York Yankees",
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
        recentNews: "Sets new AL home run record in historic season",
        upcomingMatch: {
          opponent: "Boston Red Sox",
          date: "2025-07-31",
          time: "19:05",
          venue: "Yankee Stadium"
        },
        lastMatch: {
          opponent: "Baltimore Orioles",
          score: "7-3",
          performance: "2-4, 1 HR, 3 RBI",
          date: "2025-07-26"
        },
        contract: "$360M (2023-2031)",
        age: 31,
        experience: "8 seasons",
        trending: "+20%"
      },
      {
        id: 2,
        name: "Mike Trout",
        position: "OF",
        team: "Los Angeles Angels",
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
        recentNews: "Three-time MVP returns to elite form",
        upcomingMatch: {
          opponent: "Houston Astros",
          date: "2025-07-31",
          time: "19:10",
          venue: "Angel Stadium"
        },
        lastMatch: {
          opponent: "Seattle Mariners",
          score: "8-5",
          performance: "3-4, 2 HR, 4 RBI",
          date: "2025-07-26"
        },
        contract: "$426.5M (2019-2030)",
        age: 33,
        experience: "13 seasons",
        trending: "+12%"
      },
      {
        id: 3,
        name: "Mookie Betts",
        position: "OF",
        team: "Los Angeles Dodgers",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&crop=face",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop",
        stats: {
          avg: .307,
          homeRuns: 35,
          rbi: 82,
          ops: .911
        },
        attributes: {
          overall: 94,
          hitting: 93,
          fielding: 96,
          speed: 88
        },
        recentNews: "World Series champion leads Dodgers offense",
        upcomingMatch: {
          opponent: "San Francisco Giants",
          date: "2025-08-01",
          time: "22:10",
          venue: "Dodger Stadium"
        },
        lastMatch: {
          opponent: "Colorado Rockies",
          score: "7-2",
          performance: "2-3, 1 HR, 2 RBI",
          date: "2025-07-26"
        },
        contract: "$365M (2021-2032)",
        age: 31,
        experience: "11 seasons",
        trending: "+8%"
      }
    ],
    soccer: [
      {
        id: 1,
        name: "Erling Haaland",
        position: "ST",
        team: "Manchester City",
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
        recentNews: "Breaks Premier League goalscoring record",
        upcomingMatch: {
          opponent: "Arsenal",
          date: "2025-08-03",
          time: "16:30",
          venue: "Etihad Stadium"
        },
        lastMatch: {
          opponent: "Chelsea",
          score: "3-1",
          performance: "2 Goals, 1 Assist",
          date: "2025-07-27"
        },
        contract: "£375k/week (2022-2027)",
        age: 24,
        experience: "6 seasons",
        trending: "+25%"
      }
    ]
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        let players = [];

        if (selectedCategory === 'all') {
          // Fetch from all 5 core sports in parallel
          const sports = ['FOOTBALL', 'BASKETBALL', 'CRICKET', 'TENNIS', 'MMA'];
          const promises = sports.map(sport =>
            playerApiService.getTop100BySport(sport)
              .then(data => data.players || [])
              .catch(err => {
                console.warn(`Failed to fetch ${sport} players:`, err);
                return [];
              })
          );
          const allResults = await Promise.all(promises);
          players = allResults.flat();
        } else {
          const sport = categoryToSport[selectedCategory];
          if (sport) {
            const data = await playerApiService.getTop100BySport(sport);
            players = data.players || [];
          }
        }

        // Transform players for UI display
        const transformedPlayers = players.map(p => ({
          id: p.id,
          name: p.displayName || p.name,
          position: p.position || 'Unknown',
          team: p.team || 'Retired',
          avatar: p.photoUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
          teamLogo: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=50&h=50&fit=crop',
          stats: {
            ppg: p.ppg || 0,
            rpg: p.rpg || 0,
            apg: p.apg || 0,
            fg: p.fg || 'N/A'
          },
          attributes: {
            overall: p.aiRating || p.ranking_score || 80,
            offense: p.aiRating ? Math.min(99, p.aiRating + 2) : 80,
            defense: p.aiRating ? Math.max(60, p.aiRating - 5) : 75,
            athleticism: p.aiRating ? Math.min(99, p.aiRating - 2) : 78
          },
          recentNews: p.biography?.substring(0, 50) || 'Elite player',
          upcomingMatch: {
            opponent: 'TBD',
            date: new Date().toISOString(),
            time: '20:00',
            venue: 'TBD'
          },
          lastMatch: {
            opponent: 'Previous Match',
            score: 'N/A',
            performance: 'N/A',
            date: new Date().toISOString()
          },
          contract: 'Professional',
          age: p.age || 'N/A',
          experience: p.team ? 'Professional' : 'Retired',
          trending: p.previousRank
            ? (p.previousRank > p.currentRank ? `+${p.previousRank - p.currentRank}` : `${p.previousRank - p.currentRank}`)
            : '+0%'
        }));

        setPlayersData(transformedPlayers);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Failed to load players. Please try again.');
        setPlayersData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [selectedCategory]);

  // Search and filter logic
  const filteredPlayers = useMemo(() => {
    let filtered = playersData;

    if (searchQuery.trim()) {
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'team':
          aValue = a.team.toLowerCase();
          bValue = b.team.toLowerCase();
          break;
        case 'overall':
          aValue = a.attributes.overall;
          bValue = b.attributes.overall;
          break;
        case 'age':
          aValue = a.age;
          bValue = b.age;
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
  }, [playersData, searchQuery, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex);

  // Handlers
  const handlePageChange = (page) => setCurrentPage(page);
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatDisplay = (player, type) => {
    const stats = player.stats;
    switch (type) {
      case 'primary':
        if (stats.ppg) return `${stats.ppg} PPG`;
        if (stats.passYards) return `${stats.passYards} YDS`;
        if (stats.goals) return `${stats.goals} Goals`;
        if (stats.avg) return `.${Math.round(stats.avg * 1000)}`;
        return 'N/A';
      case 'secondary':
        if (stats.rpg) return `${stats.rpg} RPG`;
        if (stats.touchdowns) return `${stats.touchdowns} TD`;
        if (stats.assists) return `${stats.assists} Assists`;
        if (stats.homeRuns) return `${stats.homeRuns} HR`;
        return 'N/A';
      case 'tertiary':
        if (stats.apg) return `${stats.apg} APG`;
        if (stats.completion) return stats.completion;
        if (stats.shots) return `${stats.shots} Shots`;
        if (stats.rbi) return `${stats.rbi} RBI`;
        return 'N/A';
      default:
        return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Top Players</h2>
            <p className="text-text-secondary mt-1">Performance stats and career highlights</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <Icon name="AlertCircle" size={48} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Players</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (filteredPlayers.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              Top Players {selectedCategory !== 'all' && `- ${selectedCategory.toUpperCase()}`}
            </h2>
            <p className="text-text-secondary mt-1">
              Performance stats, upcoming matches, and latest news
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        <div className="text-center py-12">
          <Icon name="Users" size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No Players Found' : 'No Players Available'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `No players match "${searchQuery}". Try a different search term.`
              : 'No top players available for the selected sport category.'
            }
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="mt-4"
            >
              Clear Search
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-12">
      {/* Enhanced Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Top Players {selectedCategory !== 'all' && `- ${selectedCategory.toUpperCase()}`}
          </h2>
          <p className="text-text-secondary mt-1">
            Performance stats, upcoming matches, and latest news
          </p>
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search players, teams..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-64"
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
          
          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center space-x-1"
            >
              <Icon name="List" size={16} />
              <span className="hidden sm:inline">Table</span>
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="flex items-center space-x-1"
            >
              <Icon name="Grid3x3" size={16} />
              <span className="hidden sm:inline">Cards</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <div>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)} of {filteredPlayers.length} players
          {searchQuery && (
            <span className="ml-2">
              for "<span className="font-medium text-text-primary">{searchQuery}</span>"
            </span>
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        /* Enhanced Table View with Sorting */
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Player</span>
                      {sortField === 'name' && (
                        <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('overall')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Overall Rating</span>
                      {sortField === 'overall' && (
                        <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('team')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Team</span>
                      {sortField === 'team' && (
                        <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Match
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('age')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Age</span>
                      {sortField === 'age' && (
                        <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPlayers.map((player, index) => (
                  <tr key={`${selectedCategory}-${player.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Image
                            src={player.avatar}
                            alt={player.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <Image
                            src={player.teamLogo}
                            alt={player.team}
                            className="w-6 h-6 rounded-full absolute -bottom-1 -right-1 border-2 border-white"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-primary">{player.name}</div>
                          <div className="text-sm text-text-secondary">{player.position}</div>
                          <div className="text-xs text-text-secondary">{player.experience}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-text-primary">
                          {getStatDisplay(player, 'primary')}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {getStatDisplay(player, 'secondary')}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {getStatDisplay(player, 'tertiary')}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-secondary">Overall</span>
                            <span className="text-sm font-bold">{player.attributes.overall}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${player.attributes.overall}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Icon name="TrendingUp" size={14} className="text-success" />
                          <span className="text-xs font-medium text-success">{player.trending}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Image
                          src={player.teamLogo}
                          alt={player.team}
                          className="w-6 h-6 rounded-full"
                        />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{player.team}</div>
                          <div className="text-xs text-text-secondary">{player.contract}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-text-primary">
                          vs {player.upcomingMatch.opponent}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {formatDate(player.upcomingMatch.date)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {player.upcomingMatch.venue}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-text-primary">{player.age} years</div>
                        <div className="text-xs text-text-secondary">{player.experience}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Link to={`/player-profile/${player.id}`}>
                          <Button size="sm" variant="outline">
                            <Icon name="Eye" size={14} className="mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost">
                          <Icon name="Heart" size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Enhanced Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPlayers.map((player, index) => (
            <div key={`${selectedCategory}-card-${player.id}-${index}`} className="bg-white rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Image
                      src={player.avatar}
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <Image
                      src={player.teamLogo}
                      alt={player.team}
                      className="w-6 h-6 rounded-full absolute -bottom-1 -right-1 border-2 border-white"
                    />
                  </div>
                  <div>
                    <Link 
                      to={`/player-profile?id=${player.id}`}
                      className="text-sm font-medium text-text-primary hover:text-primary transition-colors"
                    >
                      {player.name}
                    </Link>
                    <div className="text-sm text-text-secondary">
                      {player.position} • {player.team}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-success">
                  <Icon name="TrendingUp" size={14} />
                  <span className="text-xs font-medium">{player.trending}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-lg font-bold text-text-primary">{getStatDisplay(player, 'primary').split(' ')[0]}</div>
                  <div className="text-xs text-text-secondary">{getStatDisplay(player, 'primary').split(' ')[1]}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-lg font-bold text-text-primary">{getStatDisplay(player, 'secondary').split(' ')[0]}</div>
                  <div className="text-xs text-text-secondary">{getStatDisplay(player, 'secondary').split(' ')[1]}</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-lg font-bold text-text-primary">{getStatDisplay(player, 'tertiary').split(' ')[0]}</div>
                  <div className="text-xs text-text-secondary">{getStatDisplay(player, 'tertiary').split(' ')[1] || ''}</div>
                </div>
              </div>

              {/* Overall Rating */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Overall</span>
                  <span className="text-sm font-bold">{player.attributes.overall}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${player.attributes.overall}%` }}
                  ></div>
                </div>
              </div>

              {/* Next Match */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-1">Next Match</h4>
                <div className="text-sm text-text-secondary">
                  vs {player.upcomingMatch.opponent}
                </div>
                <div className="text-xs text-text-secondary">
                  {formatDate(player.upcomingMatch.date)}
                </div>
              </div>

              {/* Action Button */}
              <Link to={`/player-profile/${player.id}`}>
                <Button className="w-full mt-4" size="sm">
                  View Details
                  <Icon name="ArrowRight" size={14} className="ml-2" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Simple Pagination */}
      {filteredPlayers.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          {/* Page Info */}
          <div className="text-sm text-text-secondary">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)} of {filteredPlayers.length} players
            <span className="ml-4">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Simple Pagination Controls */}
          <div className="flex items-center space-x-3">
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
            
            <span className="text-sm text-text-secondary px-3">
              {currentPage} / {totalPages}
            </span>
            
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
  );
};

export default TopPlayersTable;
