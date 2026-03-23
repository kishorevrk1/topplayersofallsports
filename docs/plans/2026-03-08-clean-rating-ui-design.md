# Clean Player Rating UI — Design

**Date**: 2026-03-08
**Status**: Approved
**Branch**: highlight-service

## Problem
The ACR (AI Consensus Rating) UI exposes model internals (dual model scores, divergence, confidence badges, criteria breakdowns) that users don't understand or care about. Ronaldo went from 98 to 75 because of fallback scores. Users want to see WHY a player is rated high — achievements, story, stats — not how the AI computed the number.

## Solution
Remove ACR internal UI components. Show clean rating + biography + highlights + strengths. Use `aiRating` from AIAnalysis as the display score (not `consensusRating`).

## Changes

### Frontend — Remove from UI
- RatingBreakdownCard usage in OverviewTab
- ConfidenceBadge usage in PlayerCard + PlayersDirectory
- RatingHistoryChart usage in OverviewTab
- "AI Consensus" badge text

### Frontend — Clean OverviewTab
1. Large rating number with "All-Time Rating" label + subtle "AI-powered" tag
2. Biography section
3. Career Highlights
4. Strengths
5. Personal Info + Achievements (existing grid)

### Frontend — Clean PlayersDirectory
- Remove ConfidenceBadge import and usage
- Remove Confidence column from list view
- Keep clean rating bar

### Backend — Rating priority
- `GET /api/players/{id}`: use `aiRating` from AIAnalysis as primary display score
- `GET /api/players/top100/{sport}`: same — `aiRating` over `consensusRating`
- Remove `consensusRating`, `confidenceLevel`, `divergenceScore` from API responses (not needed by UI)
