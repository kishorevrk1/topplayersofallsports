import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const PlayerProfile = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock player data
  const mockPlayer = {
    id: searchParams.get('id') || '1',
    name: "LeBron James",
    fullName: "LeBron Raymone James Sr.",
    sport: "Basketball",
    team: {
      id: "lakers",
      name: "Los Angeles Lakers",
      logo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop&crop=center"
    },
    jerseyNumber: "6",
    position: "Small Forward",
    age: 39,
    height: "6\'9\"",
    weight: "250 lbs",
    status: "Active",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop&crop=center",
    dateOfBirth: "December 30, 1984",
    birthplace: "Akron, Ohio, USA",
    nationality: "American",
    college: "St. Vincent-St. Mary High School",
    keyStats: [
      { label: "PPG", value: "25.3" },
      { label: "RPG", value: "7.3" },
      { label: "APG", value: "7.4" }
    ],
    biography: `LeBron James is widely considered one of the greatest basketball players of all time. Known for his incredible versatility, basketball IQ, and leadership on and off the court, LeBron has dominated the NBA for over two decades.\n\nThroughout his career, he has played for the Cleveland Cavaliers, Miami Heat, and currently the Los Angeles Lakers. His ability to play and defend multiple positions, combined with his exceptional passing skills and clutch performances, has made him a four-time NBA champion and four-time NBA Finals MVP.\n\nOff the court, LeBron is equally impressive as a businessman, philanthropist, and social activist, using his platform to advocate for education and social justice causes.`,
    careerHighlights: [
      {
        title: "4× NBA Champion",
        description: "Won championships with Miami Heat (2012, 2013), Cleveland Cavaliers (2016), and Los Angeles Lakers (2020)",
        date: "2012-2020",
        location: "Various",
        icon: "Trophy"
      },
      {
        title: "4× NBA Finals MVP",
        description: "Named Finals MVP in 2012, 2013, 2016, and 2020",
        date: "2012-2020",
        location: "NBA Finals",
        icon: "Award"
      },
      {
        title: "4× NBA Most Valuable Player",
        description: "Regular season MVP awards in 2009, 2010, 2012, and 2013",
        date: "2009-2013",
        location: "NBA",
        icon: "Star"
      },
      {
        title: "All-Time Scoring Leader",
        description: "Became NBA's all-time leading scorer, surpassing Kareem Abdul-Jabbar",
        date: "February 7, 2023",
        location: "Los Angeles",
        icon: "Target"
      }
    ],
    achievements: [
      { title: "19× NBA All-Star", year: "2005-2023" },
      { title: "13× All-NBA First Team", year: "2006-2018" },
      { title: "5× All-NBA Second Team", year: "2005, 2014, 2019-2021" },
      { title: "6× All-Defensive First Team", year: "2009-2014" },
      { title: "NBA Rookie of the Year", year: "2004" },
      { title: "2× Olympic Gold Medal", year: "2008, 2012" }
    ],
    seasonStats: {
      "2024": {
        gamesPlayed: 71,
        pointsPerGame: 25.3,
        reboundsPerGame: 7.3,
        assistsPerGame: 7.4,
        fieldGoalPercentage: 54.0,
        threePointPercentage: 41.0,
        freeThrowPercentage: 75.0,
        stealsPerGame: 1.3,
        blocksPerGame: 0.5,
        turnoversPerGame: 3.5,
        minutesPerGame: 35.3
      },
      "2023": {
        gamesPlayed: 55,
        pointsPerGame: 28.9,
        reboundsPerGame: 8.3,
        assistsPerGame: 6.8,
        fieldGoalPercentage: 50.0,
        threePointPercentage: 32.1,
        freeThrowPercentage: 76.8,
        stealsPerGame: 0.9,
        blocksPerGame: 0.6,
        turnoversPerGame: 3.2,
        minutesPerGame: 35.5
      }
    },
    careerStats: {
      gamesPlayed: 1421,
      pointsPerGame: 27.1,
      reboundsPerGame: 7.5,
      assistsPerGame: 7.4,
      fieldGoalPercentage: 50.5,
      threePointPercentage: 34.5,
      freeThrowPercentage: 73.4,
      stealsPerGame: 1.6,
      blocksPerGame: 0.8,
      turnoversPerGame: 3.5,
      minutesPerGame: 38.8,
      totalPoints: 38652,
      totalRebounds: 10691,
      totalAssists: 10544
    },
    news: [
      {
        id: 1,
        title: "LeBron James Leads Lakers to Victory Against Warriors in Overtime Thriller",
        summary: "In a spectacular display of veteran leadership, LeBron James scored 35 points and dished out 12 assists to lead the Lakers to a 128-124 overtime victory over the Golden State Warriors. The game featured multiple lead changes and clutch performances from both teams.",
        category: "performance",
        source: {
          name: "ESPN",
          logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=50&h=50&fit=crop&crop=center"
        },
        publishedAt: "2025-01-24T22:30:00Z",
        views: 125000,
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop&crop=center",
        isBreaking: true
      },
      {
        id: 2,
        title: "LeBron James Foundation Opens New School in Akron",
        summary: "The LeBron James Family Foundation celebrated the opening of its third I PROMISE School in Akron, Ohio. The school will serve 240 at-risk students and their families, providing comprehensive support including meals, transportation, and college scholarships.",
        category: "personal",
        source: {
          name: "CNN Sports",
          logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=50&h=50&fit=crop&crop=center"
        },
        publishedAt: "2025-01-23T15:45:00Z",
        views: 89000,
        image: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=400&h=200&fit=crop&crop=center",
        isBreaking: false
      },
      {
        id: 3,
        title: "Lakers Injury Report: LeBron James Listed as Probable for Tonight\'s Game",
        summary: "LeBron James is listed as probable for tonight\'s game against the Denver Nuggets due to left ankle soreness. The veteran forward has been managing the injury for the past week but is expected to play through it.",
        category: "injuries",
        source: {
          name: "The Athletic",
          logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=50&h=50&fit=crop&crop=center"
        },
        publishedAt: "2025-01-22T18:20:00Z",
        views: 67000,
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop&crop=center",
        isBreaking: false
      }
    ],
    videos: [
      {
        id: 1,
        title: "LeBron James 35 Points Full Highlights vs Warriors | Lakers Win in OT",
        description: "Watch LeBron James dominate in overtime with 35 points, 8 rebounds, and 12 assists to lead the Lakers to victory over the Warriors.",
        thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=225&fit=crop&crop=center",
        duration: 480,
        views: 2500000,
        uploadedAt: "2 days ago",
        category: "highlights",
        embedUrl: "https://www.youtube.com/embed/example1"
      },
      {
        id: 2,
        title: "LeBron James Post-Game Interview After Lakers Victory",
        description: "LeBron discusses the team's performance, his leadership role, and preparation for upcoming games in this exclusive post-game interview.",
        thumbnail: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=225&fit=crop&crop=center",
        duration: 320,
        views: 890000,
        uploadedAt: "3 days ago",
        category: "interviews",
        embedUrl: "https://www.youtube.com/embed/example2"
      },
      {
        id: 3,
        title: "LeBron James Training Session: Preparing for the Playoffs",
        description: "Go behind the scenes with LeBron James as he prepares for the upcoming playoffs with intense training sessions and skill development.",
        thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop&crop=center",
        duration: 600,
        views: 1200000,
        uploadedAt: "1 week ago",
        category: "training",
        embedUrl: "https://www.youtube.com/embed/example3"
      },
      {
        id: 4,
        title: "LeBron James Best Dunks of the Season",
        description: "A compilation of LeBron James\' most powerful and spectacular dunks from the current NBA season.",
        thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=225&fit=crop&crop=center",
        duration: 240,
        views: 3200000,
        uploadedAt: "2 weeks ago",
        category: "highlights",
        embedUrl: "https://www.youtube.com/embed/example4"
      }
    ]
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'User' },
    { id: 'stats', label: 'Stats', icon: 'BarChart3' },
    { id: 'news', label: 'News', icon: 'Newspaper', badge: mockPlayer.news.length },
    { id: 'videos', label: 'Videos', icon: 'Play', badge: mockPlayer.videos.length },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab player={mockPlayer} />;
      case 'stats':
        return <StatsTab player={mockPlayer} />;
      case 'news':
        return <NewsTab player={mockPlayer} />;
      case 'videos':
        return <VideosTab player={mockPlayer} />;
      default:
        return <OverviewTab player={mockPlayer} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 pb-20 lg:pb-0">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading player profile...</p>
            </div>
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
        <Breadcrumb player={mockPlayer} />
        
        <PlayerHero 
          player={mockPlayer} 
          onFollow={handleFollow} 
          isFollowing={isFollowing} 
        />
        
        <PlayerTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          tabs={tabs} 
        />

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8">
              {renderTabContent()}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="sticky top-32 space-y-6">
                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <SocialShare player={mockPlayer} />
                    <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-150">
                      <span>Add to Favorites</span>
                    </button>
                    <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-150">
                      <span>Compare Players</span>
                    </button>
                  </div>
                </div>

                {/* Team Info */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Team Information</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={mockPlayer.team.logo}
                      alt={mockPlayer.team.name}
                      className="w-12 h-12 rounded-lg"
                    />
                    <div>
                      <div className="font-medium">{mockPlayer.team.name}</div>
                      <div className="text-sm text-text-secondary">Western Conference</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Record</span>
                      <span className="font-medium">28-26</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Conference Rank</span>
                      <span className="font-medium">9th</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Next Game</span>
                      <span className="font-medium">vs Nuggets</span>
                    </div>
                  </div>
                </div>
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