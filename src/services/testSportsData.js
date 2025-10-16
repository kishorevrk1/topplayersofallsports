/**
 * Test script for Real Sports Data Service
 * Run this to verify the APIs are working
 */

import realSportsDataService from './realSportsDataService.js';

// Test function to verify all APIs
async function testSportsDataService() {
  console.log('🧪 Testing Real Sports Data Service...\n');

  try {
    // Test 1: NBA Players
    console.log('🏀 Testing NBA Players API...');
    const nbaPlayers = await realSportsDataService.getNBAPlayers();
    console.log(`✅ NBA Players: ${nbaPlayers.length} players fetched`);
    if (nbaPlayers.length > 0) {
      console.log(`   Sample: ${nbaPlayers[0].name} - ${nbaPlayers[0].team}`);
    }
    console.log('');

    // Test 2: ESPN Scores
    console.log('📊 Testing ESPN Scores API...');
    const nbaScores = await realSportsDataService.getESPNScores('basketball', 'nba');
    console.log(`✅ NBA Scores: ${nbaScores.length} games fetched`);
    if (nbaScores.length > 0) {
      console.log(`   Sample: ${nbaScores[0].name} - ${nbaScores[0].status}`);
    }
    console.log('');

    // Test 3: Live Scores (All Sports)
    console.log('🏆 Testing Live Scores (All Sports)...');
    const liveScores = await realSportsDataService.getLiveScores();
    const totalGames = Object.values(liveScores).flat().length;
    console.log(`✅ Live Scores: ${totalGames} total games across all sports`);
    console.log(`   NBA: ${liveScores.nba.length} games`);
    console.log(`   NFL: ${liveScores.nfl.length} games`);
    console.log(`   MLB: ${liveScores.mlb.length} games`);
    console.log('');

    // Test 4: All Players (Unified)
    console.log('👥 Testing Unified Players Data...');
    const allPlayers = await realSportsDataService.getAllPlayers('all', 50);
    console.log(`✅ All Players: ${allPlayers.length} players from multiple sports`);
    
    const sportsCounts = allPlayers.reduce((acc, player) => {
      acc[player.sport] = (acc[player.sport] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(sportsCounts).forEach(([sport, count]) => {
      console.log(`   ${sport.toUpperCase()}: ${count} players`);
    });
    console.log('');

    // Test 5: Trending News
    console.log('📰 Testing Trending News...');
    const news = await realSportsDataService.getTrendingNews();
    console.log(`✅ Trending News: ${news.length} articles fetched`);
    if (news.length > 0) {
      console.log(`   Latest: ${news[0].title}`);
    }
    console.log('');

    // Test 6: Cache Status
    console.log('💾 Testing Cache System...');
    const cacheStatus = realSportsDataService.getCacheStatus();
    console.log(`✅ Cache Status: ${cacheStatus.totalCacheEntries} entries cached`);
    console.log(`   Cache Keys: ${cacheStatus.cacheKeys.join(', ')}`);
    console.log('');

    // Test 7: Force Refresh
    console.log('🔄 Testing Force Refresh...');
    const refreshedPlayers = await realSportsDataService.forceRefresh('players');
    console.log(`✅ Force Refresh: ${refreshedPlayers.length} players after refresh`);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${nbaPlayers.length} NBA players available`);
    console.log(`   - ${totalGames} live games across all sports`);
    console.log(`   - ${allPlayers.length} total players from multiple sources`);
    console.log(`   - ${news.length} trending news articles`);
    console.log(`   - ${cacheStatus.totalCacheEntries} items in cache`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test specific API endpoints
async function testSpecificAPIs() {
  console.log('🔍 Testing Specific API Endpoints...\n');

  // Test NBA API directly
  try {
    console.log('🏀 Testing NBA Stats API...');
    const nbaUrl = 'https://stats.nba.com/stats/commonallplayers?LeagueID=00&Season=2024-25&IsOnlyCurrentSeason=1';
    const nbaResponse = await fetch(nbaUrl, {
      headers: {
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com',
        'User-Agent': 'TopPlayersOfAllSports/1.0'
      }
    });
    
    if (nbaResponse.ok) {
      const nbaData = await nbaResponse.json();
      console.log(`✅ NBA API: ${nbaData.resultSets[0].rowSet.length} players`);
    } else {
      console.log(`❌ NBA API: ${nbaResponse.status} ${nbaResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ NBA API Error:`, error.message);
  }

  // Test ESPN API
  try {
    console.log('🏈 Testing ESPN API...');
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
    const espnResponse = await fetch(espnUrl);
    
    if (espnResponse.ok) {
      const espnData = await espnResponse.json();
      console.log(`✅ ESPN API: ${espnData.events?.length || 0} NBA games`);
    } else {
      console.log(`❌ ESPN API: ${espnResponse.status} ${espnResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ ESPN API Error:`, error.message);
  }

  // Test TheSportsDB API
  try {
    console.log('⚽ Testing TheSportsDB API...');
    const sportsdbUrl = 'https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?s=Soccer';
    const sportsdbResponse = await fetch(sportsdbUrl);
    
    if (sportsdbResponse.ok) {
      const sportsdbData = await sportsdbResponse.json();
      console.log(`✅ SportsDB API: ${sportsdbData.teams?.length || 0} soccer teams`);
    } else {
      console.log(`❌ SportsDB API: ${sportsdbResponse.status} ${sportsdbResponse.statusText}`);
    }
  } catch (error) {
    console.log(`❌ SportsDB API Error:`, error.message);
  }

  console.log('\n✅ API endpoint testing completed!');
}

// Export test functions
export { testSportsDataService, testSpecificAPIs };

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-running sports data tests...');
  
  // Run tests after a short delay to allow imports to settle
  setTimeout(() => {
    testSportsDataService();
  }, 1000);
}
