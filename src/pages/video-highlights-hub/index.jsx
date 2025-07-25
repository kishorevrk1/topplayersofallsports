import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import TabNavigation from '../../components/ui/TabNavigation';
import ContentFilterBar from '../../components/ui/ContentFilterBar';
import FeaturedHighlights from './components/FeaturedHighlights';
import SportFilterTabs from './components/SportFilterTabs';
import VideoFilters from './components/VideoFilters';
import VideoGrid from './components/VideoGrid';
import VideoPlayer from './components/VideoPlayer';
import TrendingSidebar from './components/TrendingSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const VideoHighlightsHub = () => {
  const [selectedSport, setSelectedSport] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [savedVideos, setSavedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    duration: 'all',
    uploadDate: 'today',
    source: 'all',
    sortBy: 'relevance',
    quality: 'all',
  });

  // Mock data for featured highlights
  const featuredVideos = [
    {
      id: 'featured-1',
      title: 'LeBron James Historic 40,000 Career Points Milestone Highlights',
      thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 420,
      views: 2500000,
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sport: 'Basketball',
      isLive: false,
      source: {
        name: 'NBA',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'featured-2',
      title: 'Super Bowl LVIII Best Moments and Game-Winning Plays',
      thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&h=450&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 600,
      views: 5200000,
      uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      sport: 'Football',
      isLive: false,
      source: {
        name: 'NFL',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'featured-3',
      title: 'Champions League Final 2024 - All Goals and Best Moments',
      thumbnail: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=450&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 480,
      views: 8900000,
      uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sport: 'Soccer',
      isLive: false,
      source: {
        name: 'UEFA',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    }
  ];

  // Mock data for video highlights
  const mockVideos = [
    {
      id: 'video-1',
      title: 'Stephen Curry Breaks NBA 3-Point Record with Incredible Performance',
      thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 240,
      views: 1200000,
      uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      sport: 'Basketball',
      isLive: false,
      source: {
        name: 'ESPN',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'video-2',
      title: 'Tom Brady Retirement Ceremony - Emotional Farewell Moments',
      thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 360,
      views: 3400000,
      uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      sport: 'Football',
      isLive: false,
      source: {
        name: 'NFL Network',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'video-3',
      title: 'Lionel Messi Magic - Best Skills and Goals Compilation',
      thumbnail: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 300,
      views: 2800000,
      uploadedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      sport: 'Soccer',
      isLive: false,
      source: {
        name: 'Fox Sports',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'video-4',
      title: 'NBA Slam Dunk Contest 2024 - All Dunks and Winner Highlights',
      thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 180,
      views: 950000,
      uploadedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      sport: 'Basketball',
      isLive: false,
      source: {
        name: 'NBA',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'video-5',
      title: 'World Series Game 7 - Championship Winning Moments',
      thumbnail: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 420,
      views: 1800000,
      uploadedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
      sport: 'Baseball',
      isLive: false,
      source: {
        name: 'MLB Network',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'video-6',
      title: 'Serena Williams Final Match - Tennis Legend Says Goodbye',
      thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 480,
      views: 2200000,
      uploadedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      sport: 'Tennis',
      isLive: false,
      source: {
        name: 'Tennis Channel',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'video-7',
      title: 'Stanley Cup Finals Overtime Winner - Historic Goal',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      duration: 150,
      views: 1500000,
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      sport: 'Hockey',
      isLive: false,
      source: {
        name: 'NHL Network',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    },
    {
      id: 'video-8',
      title: 'Tiger Woods Masters Victory - Comeback Story Highlights',
      thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=225&fit=crop',
      videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
      duration: 600,
      views: 3100000,
      uploadedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
      sport: 'Golf',
      isLive: false,
      source: {
        name: 'Golf Channel',
        logo: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=32&h=32&fit=crop'
      }
    }
  ];

  // Mock trending videos
  const trendingVideos = [
    {
      ...mockVideos[0],
      trendingScore: 245
    },
    {
      ...mockVideos[1],
      trendingScore: 189
    },
    {
      ...mockVideos[2],
      trendingScore: 156
    },
    {
      ...mockVideos[3],
      trendingScore: 134
    },
    {
      ...mockVideos[4],
      trendingScore: 98
    }
  ];

  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);

  useEffect(() => {
    // Simulate loading
    const loadVideos = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVideos(mockVideos);
      setIsLoading(false);
    };

    loadVideos();
  }, []);

  useEffect(() => {
    // Filter videos based on selected sport and filters
    let filtered = videos;

    if (selectedSport !== 'all') {
      filtered = filtered.filter(video => 
        video.sport.toLowerCase() === selectedSport.toLowerCase()
      );
    }

    // Apply additional filters
    if (filters.duration !== 'all') {
      filtered = filtered.filter(video => {
        switch (filters.duration) {
          case 'short':
            return video.duration < 240;
          case 'medium':
            return video.duration >= 240 && video.duration <= 1200;
          case 'long':
            return video.duration > 1200;
          default:
            return true;
        }
      });
    }

    if (filters.uploadDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(video => {
        const videoDate = new Date(video.uploadedAt);
        const diffInHours = (now - videoDate) / (1000 * 60 * 60);
        
        switch (filters.uploadDate) {
          case 'today':
            return diffInHours <= 24;
          case 'week':
            return diffInHours <= 168;
          case 'month':
            return diffInHours <= 720;
          case 'year':
            return diffInHours <= 8760;
          default:
            return true;
        }
      });
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(video => 
        video.source.name.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        break;
      case 'views':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
      case 'trending':
        // Sort by recent views and engagement
        filtered.sort((a, b) => {
          const aScore = b.views / ((Date.now() - new Date(a.uploadedAt)) / (1000 * 60 * 60));
          const bScore = a.views / ((Date.now() - new Date(b.uploadedAt)) / (1000 * 60 * 60));
          return bScore - aScore;
        });
        break;
      default:
        // Relevance - keep original order
        break;
    }

    setFilteredVideos(filtered);
  }, [videos, selectedSport, filters]);

  const handleVideoPlay = (video) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const handleVideoSave = (video) => {
    setSavedVideos(prev => {
      const isAlreadySaved = prev.some(saved => saved.id === video.id);
      if (isAlreadySaved) {
        return prev.filter(saved => saved.id !== video.id);
      } else {
        return [...prev, video];
      }
    });
  };

  const handleLoadMore = async () => {
    // Simulate loading more videos
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would fetch more videos from an API
    const moreVideos = mockVideos.map((video, index) => ({
      ...video,
      id: `${video.id}-more-${Date.now()}-${index}`,
      title: `${video.title} - Extended Highlights`
    }));
    
    setVideos(prev => [...prev, ...moreVideos]);
    
    // Simulate reaching the end after a few loads
    if (videos.length > 50) {
      setHasMore(false);
    }
  };

  const getRelatedVideos = (currentVideo) => {
    return videos
      .filter(video => 
        video.id !== currentVideo.id && 
        video.sport === currentVideo.sport
      )
      .slice(0, 10);
  };

  return (
    <>
      <Helmet>
        <title>Video Highlights Hub - TopPlayersofAllSports</title>
        <meta name="description" content="Watch the best sports highlights, game-winning moments, and player performances across all major sports. Stream HD videos from NBA, NFL, MLB, and more." />
        <meta name="keywords" content="sports highlights, video highlights, NBA highlights, NFL highlights, soccer highlights, sports videos" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-16 pb-20 lg:pb-0">
          {/* Content Filter Bar */}
          <ContentFilterBar />

          {/* Sport Filter Tabs */}
          <SportFilterTabs 
            selectedSport={selectedSport}
            onSportChange={setSelectedSport}
          />

          <div className="flex">
            {/* Desktop Filters Sidebar */}
            <VideoFilters
              filters={filters}
              onFiltersChange={setFilters}
              isOpen={isFilterOpen}
              onToggle={() => setIsFilterOpen(!isFilterOpen)}
            />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <div className="p-4 lg:p-6">
                {/* Featured Highlights */}
                <FeaturedHighlights 
                  featuredVideos={featuredVideos}
                  onPlay={handleVideoPlay}
                />

                {/* Mobile Filter Button */}
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h2 className="text-xl font-bold text-text-primary">
                    {selectedSport === 'all' ? 'All Highlights' : `${selectedSport} Highlights`}
                  </h2>
                  <VideoFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    isOpen={isFilterOpen}
                    onToggle={() => setIsFilterOpen(!isFilterOpen)}
                  />
                </div>

                {/* Results Count */}
                {!isLoading && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-text-secondary">
                      {filteredVideos.length} videos found
                      {selectedSport !== 'all' && ` for ${selectedSport}`}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-text-secondary hover:text-text-primary lg:hidden"
                    >
                      <Icon name="Grid3X3" size={16} />
                    </Button>
                  </div>
                )}

                {/* Video Grid */}
                <VideoGrid
                  videos={filteredVideos}
                  onVideoPlay={handleVideoPlay}
                  onVideoSave={handleVideoSave}
                  savedVideos={savedVideos}
                  isLoading={isLoading}
                  hasMore={hasMore}
                  onLoadMore={handleLoadMore}
                />
              </div>
            </div>

            {/* Trending Sidebar */}
            <TrendingSidebar
              trendingVideos={trendingVideos}
              onVideoSelect={handleVideoPlay}
            />
          </div>
        </main>

        {/* Video Player Modal */}
        <VideoPlayer
          video={selectedVideo}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false);
            setSelectedVideo(null);
          }}
          relatedVideos={selectedVideo ? getRelatedVideos(selectedVideo) : []}
          onVideoSelect={(video) => {
            setSelectedVideo(video);
          }}
        />

        <TabNavigation />
      </div>
    </>
  );
};

export default VideoHighlightsHub;