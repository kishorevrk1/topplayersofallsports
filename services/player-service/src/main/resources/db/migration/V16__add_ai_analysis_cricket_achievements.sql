-- V16: Add AI Analysis with achievements and biography for Cricket Top 100
-- Enriches existing cricket players with career highlights, strengths, and AI ratings

INSERT INTO ai_analysis (player_id, ai_rating, analysis_text, strengths, biography, career_highlights, generated_at, llm_model)
SELECT
    p.id,
    CASE p.normalized_name
        WHEN 'sachin tendulkar' THEN 99
        WHEN 'don bradman' THEN 98
        WHEN 'virat kohli' THEN 97
        WHEN 'brian lara' THEN 96
        WHEN 'jacques kallis' THEN 95
        WHEN 'ricky ponting' THEN 95
        WHEN 'kumar sangakkara' THEN 94
        WHEN 'steve smith' THEN 94
        WHEN 'anil kumble' THEN 93
        WHEN 'shane warne' THEN 94
        ELSE 75
    END,
    'Cricket legend with exceptional batting, bowling, or all-around excellence',
    CASE p.normalized_name
        WHEN 'sachin tendulkar' THEN '["Batting technique: textbook perfection across all cricket formats and conditions", "Consistency excellence: averaged 50+ in Test cricket across 24-year career", "Adaptability mastery: thrives in subcontinental pitches, Australian bouncy tracks, English seaming", "Mental strength: concentrates for entire innings without lapses", "Technical perfection: compact defense and shot selection at elite level", "Format dominance: successful in Tests, ODIs, and domestic cricket equally", "Temperament stability: rarely gets out to loose shots or impulsive play", "Range mastery: scores at all positions and plays all shot types effectively"]'::jsonb
        WHEN 'don bradman' THEN '["Batting average excellence: 99.94 Test average unmatched across any era", "Technique mastery: compact footwork and minimal moving feet", "Concentration peak: plays long innings without mental lapses", "Record-breaking performance: dominates 1930s cricket completely", "Cricket genius: understands game and opponents at highest level", "Strike rotation: rotates strike and builds partnerships systematically", "Aggression control: attacks when opportunities arise, defensive otherwise", "Pressure response: performs best under highest pressure conditions"]'::jsonb
        WHEN 'virat kohli' THEN '["Chase masterclass: highest run-chase success rate in ODI history", "Scoring aggression: accelerates seamlessly when required", "Format versatility: excels in Tests, ODIs, and T20I equally", "Modern-era dominance: sets records in current competitive cricket", "Batting consistency: averages 50+ across formats", "Mental edge: psychological advantage through aggression and intensity", "Pace handling: adapts to both pace and spin bowling effectively", "Pressure performance: elevates in World Cup and Champions Trophy moments"]'::jsonb
        WHEN 'brian lara' THEN '["Left-handed elegance: strokes flow with technical beauty and power", "Match-winning innings: delivers in crucial moments with large scores", "Test cricket excellence: record 400 not out showcases concentration", "Stroke play artistry: plays every shot in cricket textbook", "Record-breaking performances: sets multiple records during career", "Confidence aura: plays attacking cricket despite pressure", "Concentration mastery: compiles large innings regularly", "Cover drive signature: plays technical drive shot with authority"]'::jsonb
        WHEN 'jacques kallis' THEN '["All-rounder excellence: rare combination of batting and bowling at elite level", "Batting consistency: maintains 55+ Test average across career", "Bowling reliability: delivers 1000+ wickets with economical rates", "Fielding prowess: exceptional athleticism and catching ability", "Format mastery: succeeds across Tests, ODIs, and T20I", "Physical conditioning: maintains athletic performance across 20 years", "Match impact: contributes through batting, bowling, or fielding", "Under-appreciated excellence: delivers consistently without fanfare"]'::jsonb
        WHEN 'ricky ponting' THEN '["ODI mastery: highest ODI runs and centuries record", "Aggressive batting: attacks bowlers from first delivery", "Consistency level: maintains 42+ Test average across era", "Leadership authority: captains Australian team to World Cups", "Format adapter: transitions between formats effectively", "Strike rotation: rotates strike while building partnerships", "Short-pitch handling: effectively hooks and pulls bouncy deliveries", "Tournament performances: peaks in World Cup and Champions Trophy"]'::jsonb
        WHEN 'kumar sangakkara' THEN '["Batting elegance: technical perfection with graceful stroke play", "Format versatility: accumulates centuries across Tests and ODIs equally", "Consistency mastery: maintains high average across entire career", "Leadership skills: captains Sri Lanka with authority and respect", "Longevity achievement: plays elite cricket across 15+ year span", "Concentration excellence: rarely gets out to loose shots", "Athleticism and fitness: maintains physical condition throughout career", "Sportsmanship: respected by opponents for fair play and integrity"]'::jsonb
        WHEN 'steve smith' THEN '["Batting technique: unorthodox yet highly effective against varied bowling", "Unorthodox style: adapts against different bowlers and situations", "Concentration intensity: builds large scores through mental focus", "Test cricket dominance: highest average in modern Test cricket era", "Consistency record: maintains extraordinary average across seasons", "Pressure response: performs best when facing challenging bowling", "Off-stump brilliance: plays balls outside stump with precision", "Comeback resilience: returns from bans to reclaim elite status"]'::jsonb
        WHEN 'anil kumble' THEN '["Leg-spin mastery: spins ball with control and consistent performance", "Pace bowling hybrid: combines pace with spin variations", "Control excellence: maintains low economy rates consistently", "Bowling longevity: plays till 35 without significant performance decline", "Pressure application: builds pressure through accurate line and length", "Variation mastery: uses flipper and other deliveries effectively", "Death bowling: delivers at crucial moments with composure", "Mentoring influence: helps younger spinners develop throughout career"]'::jsonb
        WHEN 'shane warne' THEN '["Leg-spin revolution: transforms leg-spin into matchwinning art form", "Bowling variations: introduces new deliveries and deceptions", "Match-winning performances: delivers in crucial moments with breakthrough", "Charisma and personality: captivates audience through confidence", "Flipper mastery: invents and perfects new delivery type", "Aggression in bowling: maintains attacking line despite pressure", "Tournament performances: peaks in World Cup moments", "Comeback resilience: returns from various setbacks to peak performance"]'::jsonb
        ELSE '["Elite cricket player: exceptional skill within sport", "Format specialist: succeeds in specific format or role", "Exceptional performance: consistent excellence in competition", "Match impact: influences match outcome through performance", "Cricket excellence: maintains professional standards consistently"]'::jsonb
    END,
    CASE p.normalized_name
        WHEN 'sachin tendulkar' THEN '["100 international centuries (record)", "15,921 Test runs", "18,426 ODI runs", "200 Test match appearances", "1992-2013 career span", "Multiple Champions Trophy appearances", "Cricket Bharat Ratna", "Retirement at 40 after 24 years"]'::jsonb
        WHEN 'don bradman' THEN '["99.94 Test batting average (unmatchable)", "29 Test centuries in 52 matches", "First-class cricket dominance", "1930s cricket era legend", "Bodyline series performances", "Captaincy success", "Australian cricket icon"]'::jsonb
        WHEN 'virat kohli' THEN '["50+ international centuries", "ODI batting average above 50", "T20I success", "Modern-era dominance", "Chase master record", "Captaincy tenure", "Global cricket ambassador"]'::jsonb
        WHEN 'brian lara' THEN '["400 not out record (Test cricket)", "34 Test centuries", "17,000+ Test runs", "Left-handed elegance", "Match-winning performances", "West Indies career span", "Signature straight drive"]'::jsonb
        WHEN 'jacques kallis' THEN '["13,289 Test runs with 45 centuries", "1000+ wickets (rare all-rounder)", "ODI excellence with 17,535 runs", "South African icon", "All-rounder rarity achievement", "Tournament success"]'::jsonb
        WHEN 'ricky ponting' THEN '["30 Test centuries", "30 ODI centuries", "1999 and 2007 World Cup wins (captain)", "Australian cricket era", "Dominant batsman period", "Captaincy record", "Post-retirement success"]'::jsonb
        WHEN 'kumar sangakkara' THEN '["63 international centuries", "25 Test centuries", "25 ODI centuries", "Highest Test score run ratio", "Sri Lankan cricket legend", "Longevity and consistency", "Sportsmanship award recipient"]'::jsonb
        WHEN 'steve smith' THEN '["27 Test centuries by age 30", "Highest Test average in modern era", "Unorthodox batting technique", "Comeback from bans", "Consistency and concentration", "Australian cricket mainstay"]'::jsonb
        WHEN 'anil kumble' THEN '["619 Test wickets (off-spinner)", "1992-2008 career span", "Bowled unchanged memorable performances", "Indian bowling legend", "Captaincy tenure", "Longevity in spin bowling"]'::jsonb
        WHEN 'shane warne' THEN '["708 Test wickets (fast bowler)", "1992-2007 career span", "Leg-spin revolution", "1999 World Cup impact", "Flipper inventor", "Commentary post-career", "Australian cricket icon"]'::jsonb
        ELSE '["International cricket career", "Notable century records", "Tournament participation", "Format mastery", "Cricket excellence"]'::jsonb
    END,
    NOW(),
    'Curated Sports Database'
FROM players p
WHERE p.sport = 'CRICKET'
  AND p.current_rank IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ai_analysis WHERE player_id = p.id
  )
ON CONFLICT (player_id) DO NOTHING;
