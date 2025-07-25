import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import SearchHeader from './components/SearchHeader';
import FilterChips from './components/FilterChips';
import SearchResults from './components/SearchResults';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for search results
  const mockResults = {
    players: [
      {
        id: 1,
        name: "LeBron James",
        position: "Forward",
        team: "Los Angeles Lakers",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
        coverImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100",
        isVerified: true,
        isLive: false,
        achievements: 15,
        rating: 9.2,
        trending: 12,
        stats: [
          { label: "PPG", value: "27.1" },
          { label: "RPG", value: "7.4" },
          { label: "APG", value: "7.1" }
        ]
      },
      {
        id: 2,
        name: "Stephen Curry",
        position: "Guard",
        team: "Golden State Warriors",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100",
        isVerified: true,
        isLive: true,
        achievements: 12,
        rating: 9.0,
        trending: 8,
        stats: [
          { label: "PPG", value: "29.5" },
          { label: "3PM", value: "4.8" },
          { label: "APG", value: "6.1" }
        ]
      },
      {
        id: 3,
        name: "Giannis Antetokounmpo",
        position: "Forward",
        team: "Milwaukee Bucks",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        coverImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100",
        isVerified: true,
        isLive: false,
        achievements: 8,
        rating: 8.9,
        trending: 15,
        stats: [
          { label: "PPG", value: "31.1" },
          { label: "RPG", value: "11.8" },
          { label: "APG", value: "5.7" }
        ]
      },
      {
        id: 4,
        name: "Kevin Durant",
        position: "Forward",
        team: "Phoenix Suns",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
        coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
        teamLogo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100",
        isVerified: true,
        isLive: false,
        achievements: 11,
        rating: 8.8,
        trending: 5,
        stats: [
          { label: "PPG", value: "28.2" },
          { label: "RPG", value: "6.4" },
          { label: "APG", value: "5.0" }
        ]
      }
    ],
    news: [
      {
        id: 1,
        title: "LeBron James Breaks All-Time Scoring Record in Historic Performance",
        summary: `In a momentous night for basketball history, LeBron James surpassed Kareem Abdul-Jabbar's long-standing all-time scoring record.\n\nThe Lakers superstar achieved this milestone with a fadeaway jumper in the third quarter, sending the crowd into a frenzy and cementing his legacy as one of the greatest players ever.\n\nThe achievement comes after years of consistent excellence and dedication to the sport.`,
        thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600",
        category: "Basketball",
        source: "ESPN",
        author: "Adrian Wojnarowski",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isBreaking: true,
        views: "2.1M",
        comments: 1547,
        shares: 892
      },
      {
        id: 2,
        title: "NBA Trade Deadline: Major Moves Shake Up Championship Race",
        summary: `The NBA trade deadline delivered blockbuster moves that could reshape the championship landscape.\n\nSeveral contenders made significant acquisitions while others opted to build for the future.\n\nAnalysts are already predicting how these moves will impact the playoff picture.`,
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
        category: "Basketball",
        source: "The Athletic",
        author: "Shams Charania",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isBreaking: false,
        views: "1.8M",
        comments: 923,
        shares: 654
      },
      {
        id: 3,
        title: "Rising Stars Shine in All-Star Weekend Showcase",
        summary: `The next generation of NBA talent took center stage during All-Star Weekend.\n\nYoung players demonstrated their skills in various competitions, giving fans a glimpse of the league's bright future.\n\nSeveral rookies and sophomores made lasting impressions with their performances.`,
        thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600",
        category: "Basketball",
        source: "NBA.com",
        author: "Michael C. Wright",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        isBreaking: false,
        views: "956K",
        comments: 445,
        shares: 287
      }
    ],
    videos: [
      {
        id: 1,
        title: "LeBron James INCREDIBLE 40-Point Performance vs Warriors | Full Highlights",
        description: `Watch LeBron James dominate the court with an incredible 40-point performance against the Golden State Warriors.\n\nThis highlight reel showcases his best plays from the game including clutch shots, powerful dunks, and amazing assists.\n\nA masterclass performance from the King himself.`,
        thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600",
        duration: 720,
        views: 3200000,
        likes: 125000,
        comments: 8500,
        shares: 15000,
        channel: "NBA Official",
        channelAvatar: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100",
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        category: "Highlights",
        quality: "4K",
        isLive: false
      },
      {
        id: 2,
        title: "Stephen Curry\'s INSANE 3-Point Shooting Display | 12 Threes Made!",
        description: `Stephen Curry puts on a three-point shooting clinic, making 12 three-pointers in a single game.\n\nWatch as the Warriors superstar breaks records and amazes fans with his incredible range and accuracy.\n\nThis performance will go down in NBA history as one of the greatest shooting displays ever.`,
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
        duration: 480,
        views: 2800000,
        likes: 98000,
        comments: 6200,
        shares: 11000,
        channel: "Golden State Warriors",
        channelAvatar: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        category: "Highlights",
        quality: "HD",
        isLive: false
      },
      {
        id: 3,
        title: "LIVE: NBA Finals Game 7 - Lakers vs Celtics | Championship Deciding Game",
        description: `The ultimate showdown is here! Game 7 of the NBA Finals between the Lakers and Celtics.\n\nTwo legendary franchises battle for the championship in what promises to be an epic conclusion to the season.\n\nDon't miss a second of this historic game.`,
        thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600",
        duration: 0,
        views: 5600000,
        likes: 245000,
        comments: 18500,
        shares: 32000,
        channel: "NBA on TNT",
        channelAvatar: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100",
        publishedAt: new Date(),
        category: "Live",
        quality: "4K",
        isLive: true
      }
    ],
    teams: [
      {
        id: 1,
        name: "Los Angeles Lakers",
        sport: "Basketball",
        league: "NBA",
        logo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200",
        coverImage: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
        isVerified: true,
        isLive: false,
        newsCount: 24,
        wins: 35,
        losses: 28,
        ranking: 7,
        trending: 8,
        nextGame: "vs Warriors - Mar 15",
        stadium: "Crypto.com Arena",
        founded: "1947",
        fans: "12.5M",
        videos: 156,
        topPlayers: [
          { name: "LeBron James", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100" },
          { name: "Anthony Davis", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
          { name: "Russell Westbrook", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" }
        ]
      },
      {
        id: 2,
        name: "Golden State Warriors",
        sport: "Basketball",
        league: "NBA",
        logo: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200",
        coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
        isVerified: true,
        isLive: true,
        newsCount: 31,
        wins: 42,
        losses: 21,
        ranking: 3,
        trending: 15,
        nextGame: "@ Lakers - Mar 15",
        stadium: "Chase Center",
        founded: "1946",
        fans: "8.9M",
        videos: 203,
        topPlayers: [
          { name: "Stephen Curry", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
          { name: "Klay Thompson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
          { name: "Draymond Green", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" }
        ]
      }
    ]
  };

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query) => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (query.trim()) {
        // Filter mock results based on search query
        const filteredResults = {
          players: mockResults.players.filter(player =>
            player.name.toLowerCase().includes(query.toLowerCase()) ||
            player.team.toLowerCase().includes(query.toLowerCase()) ||
            player.position.toLowerCase().includes(query.toLowerCase())
          ),
          news: mockResults.news.filter(article =>
            article.title.toLowerCase().includes(query.toLowerCase()) ||
            article.summary.toLowerCase().includes(query.toLowerCase()) ||
            article.category.toLowerCase().includes(query.toLowerCase())
          ),
          videos: mockResults.videos.filter(video =>
            video.title.toLowerCase().includes(query.toLowerCase()) ||
            video.description.toLowerCase().includes(query.toLowerCase()) ||
            video.channel.toLowerCase().includes(query.toLowerCase())
          ),
          teams: mockResults.teams.filter(team =>
            team.name.toLowerCase().includes(query.toLowerCase()) ||
            team.sport.toLowerCase().includes(query.toLowerCase()) ||
            team.league.toLowerCase().includes(query.toLowerCase())
          )
        };
        setResults(filteredResults);
      } else {
        setResults(mockResults);
      }
      setIsLoading(false);
    }, 800);
  };

  const handleSearchChange = (newQuery) => {
    setSearchQuery(newQuery);
    performSearch(newQuery);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // In a real app, this would trigger a new search with filters
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