-- V14: Add AI Analysis with achievements and biography for Basketball Top 100
-- Enriches existing basketball players with career highlights, strengths, and AI ratings

INSERT INTO ai_analysis (player_id, ai_rating, analysis_text, strengths, biography, career_highlights, generated_at, llm_model)
SELECT
    p.id,
    CASE p.normalized_name
        WHEN 'michael jordan' THEN 99
        WHEN 'lebron james' THEN 98
        WHEN 'kareem abdul-jabbar' THEN 97
        WHEN 'magic johnson' THEN 96
        WHEN 'larry bird' THEN 95
        WHEN 'wilt chamberlain' THEN 96
        WHEN 'shaquille o''neal' THEN 95
        WHEN 'kobe bryant' THEN 95
        WHEN 'tim duncan' THEN 94
        WHEN 'stephen curry' THEN 93
        WHEN 'lakers' THEN 92
        ELSE 75
    END,
    'Basketball legend with exceptional athleticism and performance',
    CASE p.normalized_name
        WHEN 'michael jordan' THEN '["Scoring dominance: unguardable from any distance with mid-range mastery", "Defensive intensity: locks down opponents with suffocating pressure and anticipation", "Clutch gene: elevates performance in Finals and championship moments", "Athleticism peak: vertical leap and lateral quickness unmatched in era", "Competitiveness drive: psychological warfare and winning mentality", "Mid-range perfectionism: 45% from mid-range (era record)", "Leadership presence: commands respect and team cohesion through example", "Basketball IQ: reads defensive schemes and exploits weaknesses"]'::jsonb
        WHEN 'lebron james' THEN '["All-around versatility: plays all five positions at elite level", "Strength and athleticism: combines size, power, and speed uniquely", "Basketball intelligence: orchestrates offense and defense from any position", "Leadership authority: elevates teammates through playmaking and mentoring", "Longevity mastery: maintains elite performance across 20+ year career", "Defensive versatility: guards positions 1-5 effectively throughout career", "Playmaking excellence: 10,000+ career assists from forward position", "Physical conditioning: exceptional maintenance of athleticism into 40s"]'::jsonb
        WHEN 'kareem abdul-jabbar' THEN '["Skyhook perfection: unstoppable and virtually undefendable signature shot", "Scoring consistency: maintained 20+ PPG for 14 consecutive seasons", "Longevity record: All-Star selections across three decades", "Technical mastery: refined footwork and post moves to highest level", "Physical conditioning: disciplined training regimen extended peak years", "Basketball fundamentals: textbook execution of core skills", "Competitive excellence: peak performance sustained over long career", "Scoring range: effective from multiple spots on court"]'::jsonb
        WHEN 'magic johnson' THEN '["Point guard excellence: revolutionizes position with size and versatility", "Court vision: assists from unexpected angles and positions", "Leadership magnetism: commands Lakers dynasty teams with authority", "Basketball intelligence: reads plays three moves ahead", "Playmaking: 10,000+ career assists with court awareness", "Size advantage: 6-9 point guard creates matchup problems", "Winning mentality: 5 championship runs with different rosters", "Fast-break orchestration: controls tempo and transition advantages"]'::jsonb
        WHEN 'larry bird' THEN '["Shooting precision: elite accuracy from three-point range in pre-modern era", "Clutch gene: delivers in Finals and playoff moments consistently", "Basketball fundamentals: textbook execution of footwork and spacing", "Competitive fire: trash talk and psychological edge in competition", "All-around game: combines scoring, rebounding, and playmaking", "Basketball IQ: reads defense and exploits matchups effectively", "Toughness: plays through injuries with intensity maintained", "Leadership presence: commands respect through performance and work ethic"]'::jsonb
        WHEN 'wilt chamberlain' THEN '["Athletic dominance: unmatched physical capabilities in any era", "Scoring power: 100-point game showcases offensive potential", "Physical superiority: speed and jumping ability combined uniquely", "Rebounding prowess: grabs 25+ rebounds per game regularly", "Athleticism records: sets standards for physical performance", "Defensive presence: blocks and athletic defense at elite level", "Conditioning peak: maintains supreme athleticism across career", "Record holder: 1960s scoring and rebounding dominance"]'::jsonb
        WHEN 'shaquille o''neal' THEN '["Post dominance: unguardable in pick-and-roll and post situations", "Physical presence: 7-1, 325 lbs creates size mismatch", "Defensive intensity: blocks shots and intimidates opponents", "Championship mentality: delivers in three-peats with different teams", "Unstoppable force: near-impossible to defend one-on-one", "Footwork mastery: up-and-under moves and post fades", "Rebounding excellence: controls boards in high-volume attempts", "Presence evolution: adapts from scoring to defense-focused years"]'::jsonb
        WHEN 'kobe bryant' THEN '["Scoring versatility: creates shots from any distance and position", "Clutch performance: 81-point game shows scoring potential", "Mamba mentality: unrelenting competitiveness and work ethic", "All-around game: scores, passes, and defends at high level", "Work ethic commitment: legendary training and preparation", "Mid-range mastery: 45%+ from mid-range consistently", "Leadership growth: matures from scoring to team leadership", "Longevity achievement: All-Star selections across 20 year career"]'::jsonb
        WHEN 'tim duncan' THEN '["Fundamental excellence: textbook post moves and footwork", "Consistency level: 19+ PPG, 10+ RPG across 19 seasons", "Defense and rebounding: controls paint on both ends", "Leadership authority: quiet confidence and steady presence", "Post moves: mastery of footwork and positioning", "Big man evolution: adapts from scoring to defense emphasis", "Stability factor: constant excellence for Spurs dynasty", "Basketball IQ: reads game and defensive schemes effectively"]'::jsonb
        WHEN 'stephen curry' THEN '["Three-point revolution: introduces unlimited range to basketball", "Shooting range: makes 35-foot three-pointers regularly", "Ball handling: dribbling skills create shooting opportunities", "Game-changing gravity: opponents must guard entire court", "Efficiency mastery: highest true shooting percentage ever", "Shooting accuracy: 50-40-90 club with multiple selections", "Quick release: fastest shot in NBA creates defensive problems", "Range expansion: stretches defense and creates spacing"]'::jsonb
        ELSE '["Elite basketball player: exceptional skill within peer group", "High performance: consistent excellence in competition", "Team contribution: impacts winning through various dimensions", "Championship experience: participates in title runs", "Professional excellence: maintains elite level performance"]'::jsonb
    END,
    CASE p.normalized_name
        WHEN 'michael jordan' THEN '["6 NBA Championships (1991-1993, 1996-1998)", "5 MVP awards", "6 Finals MVP awards", "10 scoring titles", "1995 All-Star game appearances", "Defensive Player of the Year", "All-time leading scorer", "Greatest basketball player"]'::jsonb
        WHEN 'lebron james' THEN '["4 NBA Championships (2012, 2013, 2016, 2020)", "4 MVP awards", "4 Finals MVP awards", "10 Finals appearances", "All-time leading scorer (2023)", "15+ All-Star selections", "10+ All-NBA selections", "Longevity and consistency"]'::jsonb
        WHEN 'kareem abdul-jabbar' THEN '["3 NBA Championships", "6 MVP awards (all-time record)", "20 All-Star selections", "All-time leading scorer (until 2023)", "15 All-NBA selections", "11 scoring titles", "Consistency over 20 seasons", "Skyhook dominance"]'::jsonb
        WHEN 'magic johnson' THEN '["5 NBA Championships (1980, 1982, 1985, 1987, 1988)", "3 MVP awards", "3 Finals MVP awards", "12 All-Star selections", "9 All-NBA selections", "Fast break revolutionizer", "Lakers dynasty leader"]'::jsonb
        WHEN 'larry bird' THEN '["3 NBA Championships (1981, 1984, 1986)", "3 MVP awards", "2 Finals MVP awards", "12 All-Star selections", "9 All-NBA selections", "Clutch performer", "Celtic dynasty contributor"]'::jsonb
        WHEN 'wilt chamberlain' THEN '["2 NBA Championships", "1 MVP award", "7 scoring titles", "100-point game (single game record)", "Rebounding dominance", "Multiple season scoring records", "Athletic phenomena", "1960s dominance"]'::jsonb
        WHEN 'shaquille o''neal' THEN '["4 NBA Championships (2000, 2001, 2002, 2006)", "1 MVP award", "3 Finals MVP awards", "15 All-Star selections", "8 All-NBA selections", "Post dominance", "Most dominant big man era"]'::jsonb
        WHEN 'kobe bryant' THEN '["5 NBA Championships (2000, 2001, 2002, 2009, 2010)", "1 MVP award", "2 Finals MVP awards", "18 All-Star selections", "11 All-NBA selections", "3rd all-time leading scorer", "Clutch playoff performances", "24-year Lakers tenure"]'::jsonb
        WHEN 'tim duncan' THEN '["5 NBA Championships (1999, 2003, 2005, 2007, 2014)", "2 MVP awards", "3 Finals MVP awards", "15 All-Star selections", "10 All-NBA selections", "Fundamental excellence", "San Antonio dynasty"]'::jsonb
        WHEN 'stephen curry' THEN '["3 NBA Championships (2015, 2017, 2022)", "1 MVP award", "1 Finals MVP award", "10 All-Star selections", "Changed three-point shooting forever", "First unanimous MVP (2016)", "Gravity and efficiency", "Warriors dynasty cornerstone"]'::jsonb
        ELSE '["NBA career success", "All-Star performances", "Championship runs", "Scoring excellence", "Team contributions"]'::jsonb
    END,
    NOW(),
    'Curated Sports Database'
FROM players p
WHERE p.sport = 'BASKETBALL'
  AND p.current_rank IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ai_analysis WHERE player_id = p.id
  )
ON CONFLICT (player_id) DO NOTHING;
