import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
// Add your imports here
import HomeDashboard from "pages/home-dashboard";
import UserAuthentication from "pages/user-authentication";
import OAuthCallback from "pages/oauth-callback";
import BreakingNewsFeed from "pages/breaking-news-feed";
import PlayerProfile from "pages/player-profile";
import PlayersDirectory from "pages/players-directory";
import VideoHighlightsHub from "pages/video-highlights-hub";
import SearchResults from "pages/search-results";
import SportsCalendarPage from "pages/sports-calendar/SportsCalendarPage";
import Profile from "pages/profile";
import EditProfile from "pages/profile/edit";
import Settings from "pages/settings";
import PlayerComparisonPage from "pages/player-comparison";
import NotFound from "pages/NotFound";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your routes here */}
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/home-dashboard" element={<HomeDashboard />} />
        <Route path="/user-authentication" element={<UserAuthentication />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/breaking-news-feed" element={<BreakingNewsFeed />} />
        <Route path="/players" element={<PlayersDirectory />} />
        <Route path="/player-profile/:id" element={<PlayerProfile />} />
        <Route path="/player-profile" element={<PlayerProfile />} />
        <Route path="/video-highlights-hub" element={<VideoHighlightsHub />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/sports-calendar" element={<SportsCalendarPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/compare" element={<PlayerComparisonPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;