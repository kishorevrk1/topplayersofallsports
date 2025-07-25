import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import NewsCard from './components/NewsCard';
import TrendingSidebar from './components/TrendingSidebar';
import SportFilterChips from './components/SportFilterChips';
import NewsSearchBar from './components/NewsSearchBar';
import RefreshIndicator from './components/RefreshIndicator';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import aiSportsService from '../../services/aiSportsService';

const BreakingNewsFeed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [newArticlesCount, setNewArticlesCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newsArticles, setNewsArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock news articles data
  const mockArticles = [
    {
      id: 1,
      headline: "LeBron James Breaks All-Time Scoring Record in Historic Lakers Victory",
      summary: `In a momentous night for basketball history, LeBron James surpassed Kareem Abdul-Jabbar's long-standing all-time scoring record during the Lakers' 133-130 victory over the Oklahoma City Thunder. The 38-year-old superstar needed just 36 points to break the record and delivered with a signature fadeaway jumper in the third quarter.\n\nThe crowd erupted as James raised his arms in celebration, acknowledging the historic achievement that many thought would never be broken. NBA Commissioner Adam Silver was in attendance to witness the historic moment.`,
      image: "https://images.unsplash.com/photo-1546525848-3ce03ca516f6?w=800&h=600&fit=crop",
      source: "ESPN",
      publishedAt: new Date(Date.now() - 300000), // 5 minutes ago
      tags: ["LeBron James", "Lakers", "NBA", "Scoring Record"],
      views: 125000,
      comments: 2847,
      originalUrl: "https://espn.com/nba/story/lebron-record",
      isBreaking: true,
      isLive: true
    },
    {
      id: 2,
      headline: "Tom Brady Announces Comeback: Signs with Miami Dolphins",
      summary: `In a shocking turn of events, Tom Brady has announced his return to the NFL after a brief retirement, signing a one-year deal with the Miami Dolphins. The 46-year-old quarterback cited unfinished business and the opportunity to play in his home state as key factors in his decision.\n\nThe Dolphins, who struggled at the quarterback position last season, view Brady as the missing piece for a championship run. The signing is expected to be officially announced at a press conference tomorrow.`,
      image: "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?w=800&h=600&fit=crop",
      source: "NFL Network",
      publishedAt: new Date(Date.now() - 900000), // 15 minutes ago
      tags: ["Tom Brady", "Dolphins", "NFL", "Comeback"],
      views: 98000,
      comments: 1923,
      originalUrl: "https://nfl.com/news/brady-dolphins",
      isBreaking: true,
      isLive: false
    },
    {
      id: 3,
      headline: "Manchester United Completes Record-Breaking Transfer for Kylian Mbappé",
      summary: `Manchester United has completed the signing of Kylian Mbappé from Paris Saint-Germain in a deal worth €200 million, making it the most expensive transfer in football history. The French superstar has signed a five-year contract with the Red Devils.\n\nMbappé expressed his excitement about joining the Premier League and working under manager Erik ten Hag. The transfer is expected to significantly boost United's chances in both domestic and European competitions.`,
      image: "https://images.pixabay.com/photo/2016/11/29/13/14/attractive-1869761_1280.jpg?w=800&h=600&fit=crop",
      source: "Sky Sports",
      publishedAt: new Date(Date.now() - 1800000), // 30 minutes ago
      tags: ["Kylian Mbappé", "Manchester United", "Transfer", "Premier League"],
      views: 87000,
      comments: 1654,
      originalUrl: "https://skysports.com/football/mbappe-united",
      isBreaking: false,
      isLive: false
    },
    {
      id: 4,
      headline: "Connor McDavid Scores Hat Trick in Oilers\' Playoff Victory",
      summary: `Edmonton Oilers captain Connor McDavid delivered a spectacular performance with a natural hat trick in the third period, leading his team to a crucial 5-2 victory over the Calgary Flames in Game 3 of their playoff series.\n\nMcDavid's three goals came within a span of 8 minutes and 47 seconds, tying the NHL record for fastest hat trick in playoff history. The Oilers now lead the series 2-1 and are one win away from advancing to the next round.`,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      source: "TSN",
      publishedAt: new Date(Date.now() - 2700000), // 45 minutes ago
      tags: ["Connor McDavid", "Oilers", "NHL", "Playoffs"],
      views: 65000,
      comments: 892,
      originalUrl: "https://tsn.ca/hockey/mcdavid-hat-trick",
      isBreaking: false,
      isLive: false
    },
    {
      id: 5,
      headline: "Serena Williams Announces Return to Professional Tennis",
      summary: `Tennis legend Serena Williams has announced her return to professional tennis after a year-long hiatus, confirming her participation in the upcoming Wimbledon Championships. The 42-year-old, who has won 23 Grand Slam singles titles, cited her love for the game and unfinished business as motivating factors.\n\nWilliams will begin her comeback at the Miami Open next month, where she plans to test her fitness and competitive form before the grass court season begins.`,
      image: "https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?w=800&h=600&fit=crop",
      source: "Tennis Channel",
      publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
      tags: ["Serena Williams", "Tennis", "Wimbledon", "Comeback"],
      views: 54000,
      comments: 743,
      originalUrl: "https://tennischannel.com/serena-return",
      isBreaking: false,
      isLive: false
    },
    {
      id: 6,
      headline: "Golden State Warriors Trade Draymond Green to Boston Celtics",
      summary: `In a surprising move, the Golden State Warriors have traded veteran forward Draymond Green to the Boston Celtics in exchange for multiple draft picks and role players. The trade marks the end of an era for the Warriors' championship core.\n\nGreen, who has been with the Warriors for his entire 12-year career, expressed mixed emotions about the trade but is excited about the opportunity to compete for another championship with the Celtics.`,
      image: "https://images.pixabay.com/photo/2017/04/25/22/16/basketball-2258650_1280.jpg?w=800&h=600&fit=crop",
      source: "The Athletic",
      publishedAt: new Date(Date.now() - 5400000), // 1.5 hours ago
      tags: ["Draymond Green", "Warriors", "Celtics", "Trade"],
      views: 43000,
      comments: 567,
      originalUrl: "https://theathletic.com/warriors-trade",
      isBreaking: false,
      isLive: false
    }
  ];

  // Filter articles based on selected sport and search query
  const filteredArticles = mockArticles.filter(article => {
    const matchesSport = selectedSport === 'all' || 
      (selectedSport === 'basketball' && (article.tags.includes('NBA') || article.tags.includes('Lakers') || article.tags.includes('Warriors') || article.tags.includes('Celtics'))) ||
      (selectedSport === 'football' && (article.tags.includes('NFL') || article.tags.includes('Dolphins'))) ||
      (selectedSport === 'soccer' && (article.tags.includes('Premier League') || article.tags.includes('Manchester United'))) ||
      (selectedSport === 'hockey' && (article.tags.includes('NHL') || article.tags.includes('Oilers'))) ||
      (selectedSport === 'tennis' && article.tags.includes('Tennis'));
    
    const matchesSearch = !searchQuery || 
      article.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSport && matchesSearch;
  });

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setArticles(filteredArticles);
      setLoading(false);
    }, 500);
  }, [selectedSport, searchQuery]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (selectedSport !== 'all') params.set('sport', selectedSport);
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
  }, [selectedSport, searchQuery, setSearchParams]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setNewArticlesCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const loadNews = async () => {
    setLoading(true);
    try {
      // Generate AI-powered breaking news
      const aiNews = await Promise.all([
        aiSportsService.generateNewsArticle('breaking trade announcement', 'NBA'),
        aiSportsService.generateNewsArticle('playoff update', 'NFL'),
        aiSportsService.generateNewsArticle('injury report', 'MLB'),
        aiSportsService.generateNewsArticle('championship qualification', 'Soccer'),
        aiSportsService.generateNewsArticle('record-breaking performance', 'NHL'),
      ]);
      
      // Sort by timestamp (most recent first)
      const sortedNews = aiNews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNewsArticles(sortedNews);
    } catch (error) {
      console.error('Error loading AI news:', error);
      // Fallback to existing mock data logic
      setNewsArticles(mockArticles);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setNewArticlesCount(0);
    setArticles(filteredArticles);
    setLoading(false);
  }, [filteredArticles]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleSportChange = (sport) => {
    setSelectedSport(sport);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      // Simulate loading more articles
      setTimeout(() => {
        setHasMore(false); // For demo, stop after first load
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 lg:pb-0">
        {/* Page Header */}
        <div className="bg-background border-b border-border">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center">
                  <Icon name="Zap" size={28} className="mr-3 text-error" />
                  Breaking News Feed
                </h1>
                <p className="text-text-secondary mt-1">
                  Stay updated with the latest sports news and breaking stories
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <NewsSearchBar 
                  onSearch={handleSearch}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:flex items-center space-x-2"
                >
                  <Icon name="Bell" size={16} />
                  <span>Notifications</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sport Filter Chips */}
        <SportFilterChips 
          selectedSport={selectedSport}
          onSportChange={handleSportChange}
        />

        {/* Refresh Indicator */}
        <RefreshIndicator 
          onRefresh={handleRefresh}
          lastUpdated={lastUpdated}
          newArticlesCount={newArticlesCount}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* News Feed */}
            <div className="lg:col-span-8">
              {loading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-card border border-border rounded-lg p-6 animate-pulse">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="h-4 bg-muted rounded w-20"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                      </div>
                      <div className="h-6 bg-muted rounded mb-3"></div>
                      <div className="h-48 bg-muted rounded mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Search" size={48} className="mx-auto text-text-secondary mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No articles found</h3>
                  <p className="text-text-secondary mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSport('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {articles.map((article) => (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      isBreaking={article.isBreaking}
                    />
                  ))}
                  
                  {hasMore && (
                    <div className="text-center py-6">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={loading}
                        className="flex items-center space-x-2"
                      >
                        {loading ? (
                          <>
                            <Icon name="Loader2" size={16} className="animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <Icon name="ChevronDown" size={16} />
                            <span>Load More Articles</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trending Sidebar - Desktop Only */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24">
                <TrendingSidebar />
              </div>
            </div>
          </div>
        </div>
      </main>

      <TabNavigation />
    </div>
  );
};

export default BreakingNewsFeed;