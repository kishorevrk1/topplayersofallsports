-- V17: Add AI Analysis with achievements and biography for Tennis Top 100
-- Enriches existing tennis players with career highlights, strengths, and AI ratings

INSERT INTO ai_analysis (player_id, ai_rating, analysis_text, strengths, biography, career_highlights, generated_at, llm_model)
SELECT
    p.id,
    CASE p.normalized_name
        WHEN 'margaret court' THEN 99
        WHEN 'serena williams' THEN 98
        WHEN 'roger federer' THEN 98
        WHEN 'rafael nadal' THEN 97
        WHEN 'novak djokovic' THEN 97
        WHEN 'pete sampras' THEN 95
        WHEN 'jimmy connors' THEN 95
        WHEN 'billie jean king' THEN 96
        WHEN 'stefanie graf' THEN 95
        WHEN 'chris evert' THEN 94
        ELSE 75
    END,
    'Tennis legend with exceptional skill, consistency, and tournament success',
    CASE p.normalized_name
        WHEN 'margaret court' THEN '["Versatility mastery: excels on grass, clay, and hard courts equally", "Consistency excellence: maintains elite performance across 15+ years", "Mental strength: psychological resilience in pressure situations", "Aggressive baseline game: controls rallies from baseline", "Multi-event mastery: wins singles, doubles, and mixed doubles", "Surface adaptation: adjusts style effectively across different court types", "Longevity record: maintains peak performance across decades", "Competitive fire: unleashes intensity in championship moments"]'::jsonb
        WHEN 'serena williams' THEN '["Serving power: fastest and most dangerous serves in women''s tennis", "Mental toughness: unshakeable composure in critical moments", "Competitive drive: refuses to accept defeat or surrender", "Baseline dominance: controls rallies and dictates terms", "Big-match performances: peaks during Grand Slams and Finals", "Physical presence: combines power with athletic grace", "Longevity achievement: maintains elite status into 40s", "Return of serve: improves significantly during career"]'::jsonb
        WHEN 'roger federer' THEN '["All-court play: effective at net, baseline, and mid-court", "Serve and volley execution: masters serve-and-volley combinations", "Technical perfection: textbook execution of all strokes", "Elegance in play: makes difficult shots look effortless", "Longevity mastery: maintains elite performance into 40s", "Grass court mastery: 8 Wimbledon titles with perfect serve-volley", "Forehand power: efficient and deadly forehand drive", "Movement efficiency: covers court with minimal unnecessary motion"]'::jsonb
        WHEN 'rafael nadal' THEN '["Clay court dominance: 14 French Open titles unmatched record", "Topspin generation: revolutionizes clay court play with extreme topspin", "Defensive excellence: retrieves impossible shots and extends rallies", "Competitive spirit: refuses to surrender despite disadvantages", "Consistency mastery: maintains high level across all surfaces", "Physical conditioning: exceptional fitness allows extended rallies", "Mental edge: psychological advantage through intensity and focus", "Return mastery: improves significantly during career trajectory"]'::jsonb
        WHEN 'novak djokovic' THEN '["Defensive excellence: unmatched retrieval and rally-extending ability", "Return dominance: best return game in tennis history", "Consistency level: maintains highest level across all surfaces", "Grand Slam success: 24 Grand Slam titles modern record", "Modern-era dominance: peaks during 2010-2020s period", "Tactical intelligence: adapts strategy against different opponents", "Longevity maintenance: prime performance across 20+ years", "Mental fortitude: psychological strength in longest rallies"]'::jsonb
        WHEN 'pete sampras' THEN '["Serve dominance: most dominant serve in 1990s era", "Volley excellence: technical mastery at net play", "Grass court mastery: 7 Wimbledon titles with aggressive serve-volley", "Explosive power: combines power and control effectively", "Consistency level: rarely makes unforced errors under pressure", "Big serve: fastest serves in era create unreturnable balls", "Net aggression: follows serve to net for quick points", "Championship mentality: peaks during major tournaments"]'::jsonb
        WHEN 'jimmy connors' THEN '["Baseline dominance: controls rallies from baseline position", "Competitive fire: unmatchable intensity and mental toughness", "Consistency excellence: maintains elite level across decades", "Longevity record: plays competitively into 50s", "Power baseline game: combines pace and accuracy from baseline", "Mental resilience: never quits despite losing positions", "Two-handed backhand: pioneering power backhand technique", "Return excellence: effective return game creates opportunities"]'::jsonb
        WHEN 'billie jean king' THEN '["Aggressive baseline play: controls rallies with aggressive shots", "Serve and volley mastery: combines net play with serve power", "Net play excellence: dominates at net position", "Championship mentality: delivers in crucial moments", "Women''s tennis pioneer: revolutionizes women''s tennis competitiveness", "Leadership presence: advocates for women''s equality in sports", "Competitive intelligence: tactics and strategy mastery", "Athletic dominance: physical superiority over contemporaries"]'::jsonb
        WHEN 'stefanie graf' THEN '["Golden Slam achievement: wins all surfaces and Olympics in single year", "Serve and volley execution: combines power serve with net play", "All-court excellence: effective at baseline, mid-court, and net", "Versatility mastery: adapts to any opponent or surface", "Tournament success: dominates multiple Grand Slams", "Physical conditioning: maintains peak fitness throughout career", "Forehand power: dominant and explosive forehand drives", "Pressure performance: delivers in finals and crucial moments"]'::jsonb
        WHEN 'chris evert' THEN '["Clay court excellence: specializes on clay with dominant record", "Consistency level: maintains 90%+ accuracy across career", "Baseline mastery: controls rallies from baseline", "Longevity achievement: maintains elite status across decades", "Mental strength: psychological edge in tight matches", "Two-handed backhand: technically perfect backhand execution", "Forehand accuracy: consistent and placement-focused forehand", "Return excellence: effective return breaks down opponent serves"]'::jsonb
        ELSE '["Elite tennis player: exceptional skill within sport", "Tournament success: wins titles consistently", "Exceptional skill: technical mastery of strokes", "Surface specialist: dominates on specific court types", "Professional excellence: maintains elite competition level"]'::jsonb
    END,
    CASE p.normalized_name
        WHEN 'margaret court' THEN '["24 Grand Slam titles (all-time record)", "12 Grand Slam doubles titles", "Career wins over 60,000 matches", "Dominated women''s tennis 1960s-1970s", "Won all surfaces and formats", "Longevity and consistency", "Tennis pioneer"]'::jsonb
        WHEN 'serena williams' THEN '["23 Grand Slam titles", "Golden Slam 2015 (calendar year all surfaces)", "14 Grand Slam doubles titles", "4 Olympic gold medals", "Dominant 2010-2017 period", "Return from motherhood comeback", "Women''s sports icon"]'::jsonb
        WHEN 'roger federer' THEN '["20 Grand Slam titles", "6 Australian Open titles", "8 Wimbledon titles", "5 US Open titles", "Wimbledon record 7 consecutive titles", "Longevity into 40s", "Tennis elegance and GOAT contender"]'::jsonb
        WHEN 'rafael nadal' THEN '["22 Grand Slam titles", "14 French Open titles (record)", "Rafa era dominance at Roland Garros", "Multiple surface success", "Australian Open and US Open success", "Championship winning years", "Competitive longevity"]'::jsonb
        WHEN 'novak djokovic' THEN '["24 Grand Slam titles", "Record weeks at No. 1", "Multiple calendar-year Grand Slams", "Australian Open dominance", "Wimbledon success", "US Open titles", "Defensive excellence era"]'::jsonb
        WHEN 'pete sampras' THEN '["14 Grand Slam titles", "7 Wimbledon titles (record)", "2 Australian Open titles", "US Open series success", "Serve-and-volley master", "1990s era dominance", "Grass court legend"]'::jsonb
        WHEN 'jimmy connors' THEN '["8 Grand Slam titles", "Longevity into 50s matches", "Competitive fire unmatched", "US Open and Australian Open success", "109 ATP titles", "Baseline game innovator", "Toughness and competitiveness"]'::jsonb
        WHEN 'billie jean king' THEN '["12 Grand Slam singles titles", "16 Grand Slam doubles titles", "Battle of the Sexes victory", "Women''s tennis pioneer", "Wimbledon and US Open dominance", "Advocacy for equal pay", "Social impact and legacy"]'::jsonb
        WHEN 'stefanie graf' THEN '["22 Grand Slam singles titles", "Golden Slam 1988 (calendar year)", "6 French Open titles", "5 Wimbledon titles", "2 US Open titles", "Olympic gold 1988", "All-surface excellence"]'::jsonb
        WHEN 'chris evert' THEN '["18 Grand Slam singles titles", "7 French Open titles", "Multiple US Open titles", "Clay court mastery", "7 Australian Open titles", "Consistency in 1970s-1980s", "Baseline game refinement"]'::jsonb
        ELSE '["Grand Slam participant", "Tournament victories", "Professional tennis career", "Surface specialist", "Career excellence"]'::jsonb
    END,
    NOW(),
    'Curated Sports Database'
FROM players p
WHERE p.sport = 'TENNIS'
  AND p.current_rank IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ai_analysis WHERE player_id = p.id
  )
ON CONFLICT (player_id) DO NOTHING;
