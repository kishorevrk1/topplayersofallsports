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
import Profile from "pages/profile";
import EditProfile from "pages/profile/edit";
import Settings from "pages/settings";
import PlayerComparisonPage from "pages/player-comparison";
import RatingDayPage from "pages/rating-day";
import NotFound from "pages/NotFound";
import ProtectedRoute from "components/auth/ProtectedRoute";

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
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/rating-day" element={<RatingDayPage />} />
        <Route path="/compare" element={<PlayerComparisonPage />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;