import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from 'components/ui/Header';
import TabNavigation from 'components/ui/TabNavigation';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import MatchupCard from './components/MatchupCard';
import RatingDayResults from './components/RatingDayResults';
import NominationPanel from './components/NominationPanel';
import CountdownTimer from './components/CountdownTimer';
import HallOfFame from './components/HallOfFame';
import PreviewMatchups from './components/PreviewMatchups';
import LiveBanner from './components/LiveBanner';
import RoundTimer from './components/RoundTimer';
import PostVoteReveal from './components/PostVoteReveal';
import { useRoundTimer } from './hooks/useRoundTimer';
import { useSoundEffects } from './hooks/useSoundEffects';
import ratingDayService from 'services/ratingDayService';
import playerApiService from 'services/playerApiService';
import { useAuth } from 'contexts/AuthContext';

const SPORTS = [
  { key: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { key: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { key: 'CRICKET', label: 'Cricket', icon: '🏏' },
  { key: 'TENNIS', label: 'Tennis', icon: '🎾' },
  { key: 'MMA', label: 'MMA', icon: '🥊' },
];

const RatingDayPage = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [selectedSport, setSelectedSport] = useState('FOOTBALL');
  const [ratingDay, setRatingDay] = useState(null);
  const [matchup, setMatchup] = useState(null);
  const [voteResult, setVoteResult] = useState(null);
  const [results, setResults] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [history, setHistory] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [showReveal, setShowReveal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('vote');
  const [completedVotes, setCompletedVotes] = useState(0);

  // Countdown timer for active rating day
  const [timeRemaining, setTimeRemaining] = useState('');

  const getNextRatingDayDate = useCallback(() => {
    if (ratingDay?.status === 'UPCOMING' && ratingDay.opensAt) {
      return new Date(ratingDay.opensAt);
    }
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  }, [ratingDay]);

  const handleSkip = useCallback(async () => {
    if (!matchup || !ratingDay) return;
    try {
      const next = await ratingDayService.skipMatchup(
        ratingDay.id,
        matchup.player1Id,
        matchup.player2Id
      );
      setMatchup(next);
      setVoteResult(null);
    } catch (err) {
      setError(err.message || 'Skip failed');
    }
  }, [matchup, ratingDay]);

  const roundTimer = useRoundTimer({
    matchupKey: matchup ? `${matchup.player1Id}-${matchup.player2Id}` : null,
    onExpired: handleSkip,
  });
  const sound = useSoundEffects();

  const targetDate = getNextRatingDayDate();
  const isWithin24h = targetDate && (targetDate.getTime() - Date.now()) <= 24 * 60 * 60 * 1000;

  const loadRatingDay = useCallback(async () => {
    setLoading(true);
    setError('');
    setMatchup(null);
    setVoteResult(null);
    setResults(null);
    setShowReveal(false);
    try {
      const rd = await ratingDayService.getCurrentRatingDay(selectedSport);
      setRatingDay(rd);

      if (rd) {
        ratingDayService.getNominations(selectedSport)
          .then(setNominations)
          .catch(() => setNominations([]));

        if (rd.status === 'ACTIVE' && isAuthenticated) {
          const m = await ratingDayService.getNextMatchup(rd.id);
          setMatchup(m);
          ratingDayService.getMyVotes(rd.id)
            .then(votes => setCompletedVotes(votes.length))
            .catch(() => {});
        } else if (rd.status === 'FINALIZED') {
          const r = await ratingDayService.getResults(rd.id);
          setResults(r);
          setTab('results');
        }
      }

      ratingDayService.getHistory(selectedSport)
        .then(setHistory)
        .catch(() => setHistory([]));
    } catch (err) {
      setError(err.message || 'Failed to load Rating Day');
    } finally {
      setLoading(false);
    }
  }, [selectedSport, isAuthenticated]);

  useEffect(() => {
    loadRatingDay();
  }, [loadRatingDay]);

  // Fetch top players for HallOfFame/Preview
  useEffect(() => {
    playerApiService.getTop100BySport(selectedSport)
      .then(data => setTopPlayers(data?.players?.slice(0, 20) || []))
      .catch(() => setTopPlayers([]));
  }, [selectedSport]);

  // Active rating day countdown
  useEffect(() => {
    if (!ratingDay || ratingDay.status !== 'ACTIVE') {
      setTimeRemaining('');
      return;
    }
    const update = () => {
      const end = new Date(ratingDay.closesAt).getTime();
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeRemaining('Voting ended');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [ratingDay]);

  // Sound integration with round timer
  useEffect(() => {
    if (roundTimer.isCritical && roundTimer.enabled && roundTimer.secondsLeft > 0) {
      sound.playSound('tick');
    }
    if (roundTimer.enabled && roundTimer.secondsLeft === 0) {
      sound.playSound('buzzer');
    }
  }, [roundTimer.secondsLeft, roundTimer.isCritical, roundTimer.enabled]);

  const handleVote = async (winnerId) => {
    if (!matchup || !ratingDay || isVoting) return;
    setIsVoting(true);
    setError('');
    try {
      const result = await ratingDayService.submitVote(
        ratingDay.id,
        matchup.player1Id,
        matchup.player2Id,
        winnerId
      );
      setVoteResult(result);
      setShowReveal(true);
      setCompletedVotes(prev => prev + 1);
      sound.playSound('confirm');

      setTimeout(() => {
        setShowReveal(false);
        if (result.nextMatchup) {
          setMatchup(result.nextMatchup);
          setVoteResult(null);
          sound.playSound('whoosh');
        } else {
          setMatchup(null);
          setVoteResult(null);
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Vote failed');
      roundTimer.pause();
    } finally {
      setIsVoting(false);
    }
  };

  const handleNomination = async (playerName, reason) => {
    await ratingDayService.submitNomination(selectedSport, playerName, reason);
    const noms = await ratingDayService.getNominations(selectedSport);
    setNominations(noms);
  };

  const handleSupport = async (nominationId) => {
    try {
      await ratingDayService.supportNomination(nominationId);
      const noms = await ratingDayService.getNominations(selectedSport);
      setNominations(noms);
    } catch (err) {
      setError(err.message || 'Support failed');
    }
  };

  const handleViewResults = async (rdId) => {
    try {
      const r = await ratingDayService.getResults(rdId);
      setResults(r);
      setTab('results');
    } catch (err) {
      setError(err.message || 'Failed to load results');
    }
  };

  // Build player objects for PostVoteReveal
  const revealPlayer1 = matchup ? {
    id: matchup.player1Id,
    name: matchup.player1DisplayName || matchup.player1Name,
    displayName: matchup.player1DisplayName,
    elo: matchup.player1Elo,
  } : null;
  const revealPlayer2 = matchup ? {
    id: matchup.player2Id,
    name: matchup.player2DisplayName || matchup.player2Name,
    displayName: matchup.player2DisplayName,
    elo: matchup.player2Elo,
  } : null;
  const revealWinnerId = voteResult ? (voteResult.player1EloChange > 0 ? matchup?.player1Id : matchup?.player2Id) : null;

  const tabs = [
    { key: 'vote', label: 'Vote', icon: 'Swords' },
    { key: 'results', label: 'Results', icon: 'BarChart3' },
    { key: 'history', label: 'History', icon: 'Clock' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Header />
      <main className="pt-16 pb-20 lg:pb-8">
        {/* Sport pills */}
        <div className="bg-white/[0.02] border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedSport(s.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedSport === s.key
                    ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LiveBanner - ACTIVE or CLOSED */}
        <LiveBanner
          status={ratingDay?.status}
          timeRemaining={timeRemaining}
          totalVotes={ratingDay?.totalVotes}
          totalVoters={ratingDay?.totalVoters}
        />

        {/* Error banner */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-start gap-3">
              <Icon name="AlertCircle" size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm mt-0.5">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
                <Icon name="X" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-slate-400">Loading Rating Day...</p>
          </div>
        )}

        {/* State: Pre-Rating Day (no active or UPCOMING) */}
        {!loading && (!ratingDay || ratingDay.status === 'UPCOMING') && tab === 'vote' && (
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <div className="text-xs uppercase tracking-widest text-amber-500 font-bold mb-2">NEXT RATING DAY</div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-500 via-red-500 to-violet-500 bg-clip-text text-transparent">
              {SPORTS.find(s => s.key === selectedSport)?.label?.toUpperCase()}
            </h1>
            <div className="mt-8">
              <CountdownTimer targetDate={getNextRatingDayDate()} onExpired={loadRatingDay} />
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Rating Day opens on {getNextRatingDayDate().toLocaleDateString()} at 00:00 UTC
            </p>
            <div className="mt-10">
              <HallOfFame players={topPlayers} />
            </div>
            {isWithin24h && (
              <div className="mt-8">
                <PreviewMatchups players={topPlayers} />
              </div>
            )}
          </div>
        )}

        {/* State: CLOSED */}
        {!loading && ratingDay?.status === 'CLOSED' && tab === 'vote' && (
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <div className="text-xl font-bold text-white mb-2">Results Coming Soon</div>
            <p className="text-slate-400">The votes are being tallied...</p>
            <div className="mt-8">
              <HallOfFame players={topPlayers} />
            </div>
          </div>
        )}

        {/* State: ACTIVE voting */}
        {!loading && tab === 'vote' && ratingDay?.status === 'ACTIVE' && (
          <>
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8">
                  <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="LogIn" size={28} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Sign in to Vote
                  </h3>
                  <p className="text-slate-400 mb-4">
                    You need to be signed in to vote in head-to-head matchups.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/user-authentication?from=/rating-day'}
                    iconName="LogIn"
                  >
                    Sign in with Google
                  </Button>
                </div>
              </div>
            ) : showReveal && revealPlayer1 && revealPlayer2 ? (
              <div className="max-w-2xl mx-auto px-4">
                <PostVoteReveal
                  voteResult={voteResult}
                  player1={revealPlayer1}
                  player2={revealPlayer2}
                  winnerId={revealWinnerId}
                />
              </div>
            ) : matchup ? (
              <div>
                <div className="flex items-center gap-4 max-w-5xl mx-auto px-4 pt-4">
                  <RoundTimer
                    {...roundTimer}
                    matchNumber={completedVotes + 1}
                    maxMatches={50}
                  />
                  <button
                    onClick={sound.toggleEnabled}
                    className={`p-2 rounded-lg transition-colors ${sound.enabled ? 'text-amber-500' : 'text-slate-500 hover:text-slate-400'}`}
                    title={sound.enabled ? 'Mute sounds' : 'Enable sounds'}
                  >
                    <Icon name={sound.enabled ? 'Volume2' : 'VolumeX'} size={18} />
                  </button>
                </div>
                <div className="max-w-5xl mx-auto px-4 py-6">
                  <MatchupCard
                    matchup={matchup}
                    onVote={handleVote}
                    onSkip={handleSkip}
                    isVoting={isVoting}
                    voteResult={null}
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto px-4 py-16 text-center">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-8">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="CheckCircle" size={28} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    All Done!
                  </h3>
                  <p className="text-slate-400">
                    You have completed all available matchups for this Rating Day.
                    Come back next month for more!
                  </p>
                  <p className="text-sm text-amber-500 font-semibold mt-3">
                    {completedVotes} votes submitted
                  </p>
                </div>
              </div>
            )}

            {/* Sidebar below matchup: How It Works + Nominations */}
            <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                  <Icon name="HelpCircle" size={20} className="text-amber-500" />
                  How It Works
                </h3>
                <ul className="space-y-2.5 text-sm text-slate-400">
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">1.</span>
                    Choose who you think is the greater all-time player
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">2.</span>
                    Your vote instantly updates both players' ELO scores
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">3.</span>
                    Up to 50 matchups per Rating Day
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500 font-bold">4.</span>
                    Rankings recalculate when voting closes
                  </li>
                </ul>
              </div>

              <NominationPanel
                nominations={nominations}
                onSubmit={handleNomination}
                onSupport={handleSupport}
                isAuthenticated={isAuthenticated}
                sport={SPORTS.find(s => s.key === selectedSport)?.label}
              />
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Results Tab */}
          {!loading && tab === 'results' && (
            <div className="max-w-2xl">
              {results ? (
                <RatingDayResults results={results} />
              ) : ratingDay?.status === 'FINALIZED' ? (
                <div className="text-center py-12">
                  <Button onClick={() => handleViewResults(ratingDay.id)}>
                    Load Results
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Results are available after the Rating Day is finalized.</p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {!loading && tab === 'history' && (
            <div className="max-w-2xl space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Icon name="Clock" size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No past Rating Days for {SPORTS.find(s => s.key === selectedSport)?.label}</p>
                </div>
              ) : (
                history.map((rd) => (
                  <div
                    key={rd.id}
                    className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-white">{rd.month}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        <span>{rd.totalVotes} votes</span>
                        <span className="text-white/10">|</span>
                        <span>{rd.totalVoters} voters</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewResults(rd.id)}>
                      View Results
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <TabNavigation />
    </div>
  );
};

export default RatingDayPage;
