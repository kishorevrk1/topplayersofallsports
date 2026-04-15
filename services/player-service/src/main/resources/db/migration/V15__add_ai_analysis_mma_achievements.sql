-- V15: Add AI Analysis with achievements and biography for MMA Top 100
-- Enriches existing MMA fighters with career highlights, strengths, and AI ratings

INSERT INTO ai_analysis (player_id, ai_rating, analysis_text, strengths, biography, career_highlights, generated_at, llm_model)
SELECT
    p.id,
    CASE p.normalized_name
        WHEN 'anderson silva' THEN 98
        WHEN 'george st-pierre' THEN 98
        WHEN 'jon jones' THEN 97
        WHEN 'floyd mayweather jr' THEN 96
        WHEN 'demetrious johnson' THEN 95
        WHEN 'fedor emelianenko' THEN 96
        WHEN 'conor mcgregor' THEN 94
        WHEN 'israel adesanya' THEN 93
        WHEN 'amanda nunes' THEN 94
        ELSE 75
    END,
    'MMA legend with exceptional fighting prowess and achievement',
    CASE p.normalized_name
        WHEN 'anderson silva' THEN '["Wrestling dominance: controls opponents on ground with technical mastery", "Striking arsenal: diverse striking combinations and footwork", "Ring intelligence: fights tactically and strategically", "Defensive mastery: slips and evades strikes with precision", "Timing and distance: manages distance and timing perfectly", "Reach utilization: uses long reach to maintain distance", "Counterstrike accuracy: counters opponent strikes effectively", "Submission defense: escapes and defends submissions reliably"]'::jsonb
        WHEN 'george st-pierre' THEN '["Wrestling excellence: dominant takedown and control abilities", "Striking power: generates power in strikes effectively", "Game planning: prepares detailed game plans for opponents", "Consistency level: maintains elite performance across career", "Championship mentality: delivers in title fights consistently", "Adaptability: adjusts strategy based on opponent style", "Physical conditioning: maintains peak fitness throughout fights", "Takedown accuracy: high-percentage wrestling takedowns"]'::jsonb
        WHEN 'jon jones' THEN '["Reach utilization: maximizes 84-inch reach advantage", "Ground and pound: devastating control and striking from top", "Adaptability: adjusts to different opponent styles", "Physical attributes: combines size, strength, and athleticism", "Striking combination: effective multi-punch combinations", "Footwork mastery: movement and positioning efficiency", "Submission defense: reliably escapes submission attempts", "Ring control: dominates octagon positioning"]'::jsonb
        WHEN 'floyd mayweather jr' THEN '["Defensive excellence: virtually impenetrable defense", "Countering mastery: effective counter-punching exchanges", "Footwork precision: technical footwork creates angles", "Ring psychology: intimidates opponents through style", "Undefeated record: maintains perfect record throughout career", "Head movement: consistent head movement avoids strikes", "Distance management: controls distance and range perfectly", "Shoulder roll defense: pioneering defensive technique"]'::jsonb
        WHEN 'demetrious johnson' THEN '["Speed and agility: exceptional quickness and movement", "Submission expertise: versatile submission arsenal", "Cardio dominance: unmatched conditioning throughout fights", "Striking combinations: effective multi-strike sequences", "Footwork mastery: precise positioning and movement", "Flying technique: aerial submissions and striking", "Pace control: dictates fight tempo effectively", "Technical excellence: refined technique across disciplines"]'::jsonb
        WHEN 'fedor emelianenko' THEN '["Heavyweight dominance: controls fights at heavyweight", "Sambo background: technical judo and sambo foundations", "Striking and wrestling: combines both disciplines effectively", "Come-from-behind victories: recovers from adversity", "Pride era success: dominates during prime fighting era", "Defensive wrestling: prevents takedowns with hand position", "Ground and pound: devastating strikes from top position", "Combat IQ: technical and strategic fighting approach"]'::jsonb
        WHEN 'conor mcgregor' THEN '["Striking accuracy: precise and accurate strike placement", "Pressure fighting: maintains constant offensive pressure", "Charisma and promotion: magnetic personality and promotion", "Southpaw advantage: effective southpaw stance utilization", "Knockout power: generates knockout power in strikes", "Combination striking: effective multi-punch sequences", "Footwork: efficient movement and positioning", "Mental confidence: psychological edge over opponents"]'::jsonb
        WHEN 'israel adesanya' THEN '["Striking precision: accurate striking from range", "Head movement: sophisticated head movement and slips", "Leg kicks mastery: dominant leg kick strategy", "Anime fighting style: unorthodox and creative fighting", "Speed advantage: quickness over larger opponents", "Distance control: manages distance precisely", "Defensive footwork: evades strikes with movement", "Striking angles: creates striking angles effectively"]'::jsonb
        WHEN 'amanda nunes' THEN '["Striking power: generates significant striking power", "Wrestling base: strong takedown and wrestling base", "Pressure application: maintains constant offensive pressure", "Judo background: uses judo throws effectively", "Female MMA pioneer: dominates women''s MMA era", "Ground control: maintains control from top position", "Combination striking: effective multi-strike sequences", "Aggressive mentality: relentless aggressive fighting"]'::jsonb
        ELSE '["Elite MMA fighter: exceptional skill within sport", "Multi-discipline mastery: combines striking and wrestling", "Championship experience: competes at title level", "Tactical excellence: strategic and technical approach", "Fight IQ: reads opponents and adapts effectively"]'::jsonb
    END,
    CASE p.normalized_name
        WHEN 'anderson silva' THEN '["2457 days middleweight title reign (record)", "10 consecutive middleweight title defenses", "UFC Hall of Fame", "Strikeforce and UFC success", "Won 16 consecutive fights", "125 UFC fights competed", "Middleweight GOAT consensus"]'::jsonb
        WHEN 'george st-pierre' THEN '["9 consecutive title defenses", "Held welterweight and middleweight belts", "UFC Hall of Fame", "Dominant GSP era", "Come-from-behind victories", "TUF ambassador and promotion", "Canadian MMA legend"]'::jsonb
        WHEN 'jon jones' THEN '["14 consecutive title defenses (record)", "Moved up in weight classes successfully", "11 consecutive victories against elite competition", "UFC Hall of Fame", "Striking and wrestling combination", "Lightweight/middleweight success"]'::jsonb
        WHEN 'floyd mayweather jr' THEN '["50-0 professional record (undefeated)", "15 world championship titles", "Super fight appearances", "Boxing legend transcending UFC", "Multiple weight class success", "Record purses and earnings"]'::jsonb
        WHEN 'demetrious johnson' THEN '["11 consecutive title defenses", "Flyweight GOAT", "Victories over multiple opponents", "Striking and wrestling mastery", "ONE Championship success", "Longevity at elite level"]'::jsonb
        WHEN 'fedor emelianenko' THEN '["Pride heavyweight champion", "28-6 record with legendary opposition", "Strikeforce and Bellator success", "Come-from-behind victories", "Fedor era dominance", "Sambo foundation applied to MMA"]'::jsonb
        WHEN 'conor mcgregor' THEN '["Fastest title achievement", "Featherweight and lightweight champion", "Record pay-per-view draws", "Promotional genius", "Notable victories over multiple champions", "Global MMA ambassador"]'::jsonb
        WHEN 'israel adesanya' THEN '["Middleweight title victories", "Striking evolution", "Anime and pop culture integration", "Multiple title defense runs", "Light heavyweight title attempts", "New generation striker"]'::jsonb
        WHEN 'amanda nunes' THEN '["Women''s bantamweight and featherweight champion", "Multiple title defenses in two weight classes", "Dominant women''s MMA era", "Judo background success", "Hall of Fame career", "Women''s MMA pioneer"]'::jsonb
        ELSE '["Significant MMA career", "Title competition", "Notable victories", "Multi-fight veteran", "Combat sports excellence"]'::jsonb
    END,
    NOW(),
    'Curated Sports Database'
FROM players p
WHERE p.sport = 'MMA'
  AND p.current_rank IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ai_analysis WHERE player_id = p.id
  )
ON CONFLICT (player_id) DO NOTHING;
