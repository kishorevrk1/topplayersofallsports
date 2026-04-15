-- V13: Add AI Analysis with achievements and biography for Football (Soccer) Top 100
-- Enriches existing football players with career highlights, strengths, and AI ratings
-- Idempotent: Tries insert and ignores on conflict (player_id unique constraint)

INSERT INTO ai_analysis (player_id, ai_rating, analysis_text, strengths, biography, career_highlights, generated_at, llm_model)
SELECT
    p.id,
    CASE p.normalized_name
        WHEN 'lionel messi' THEN 98
        WHEN 'cristiano ronaldo' THEN 97
        WHEN 'diego maradona' THEN 99
        WHEN 'johan cruyff' THEN 96
        WHEN 'pele' THEN 97
        WHEN 'franz beckenbauer' THEN 95
        WHEN 'gerd muller' THEN 94
        WHEN 'andres iniesta' THEN 92
        WHEN 'zinedine zidane' THEN 94
        WHEN 'ronaldinho' THEN 91
        WHEN 'ronaldo nazario' THEN 93
        WHEN 'romario' THEN 90
        WHEN 'marco van basten' THEN 92
        WHEN 'michel platini' THEN 89
        WHEN 'xavi hernandez' THEN 91
        WHEN 'roberto baggio' THEN 88
        WHEN 'george best' THEN 87
        WHEN 'lev yashin' THEN 89
        WHEN 'thierry henry' THEN 90
        WHEN 'eusebio' THEN 86
        WHEN 'paolo maldini' THEN 88
        WHEN 'cafu' THEN 87
        WHEN 'roberto carlos' THEN 86
        WHEN 'kaka' THEN 84
        WHEN 'rivaldo' THEN 85
        WHEN 'luis suarez' THEN 87
        WHEN 'zlatan ibrahimovic' THEN 86
        WHEN 'wayne rooney' THEN 85
        WHEN 'didier drogba' THEN 86
        WHEN 'luka modric' THEN 87
        ELSE 75 -- Default rating for others
    END,
    'Football legend with exceptional skill and achievement',
    CASE p.normalized_name
        WHEN 'lionel messi' THEN '["Left foot mastery: unparalleled precision and range from both distance and close range", "Dribbling technique: mesmerizing ball control with explosive acceleration and direction changes", "Playmaking vision: creates chances from deep positions with surgical passes", "Free-kick execution: iconic left-footed delivery with deadly accuracy", "Penalty mastery: ice-cold composure with signature low placement", "Tournament consistency: elevates performance in crucial matches (World Cup 2022 MVP)", "Spatial intelligence: anticipates opponent movement and position shifts", "Two-footed capability: dangerous on right foot despite left dominance"]'::jsonb
        WHEN 'cristiano ronaldo' THEN '["Heading dominance: unmatched aerial ability and positioning in the box", "Athletic power: explosive vertical leap and sustained muscle development", "Free-kick specialization: powerful low-ball and curved shot technique", "Leadership presence: commanding authority and goal-hungry mentality", "Right foot accuracy: versatile striker with both power and precision", "Penalty taking: psychological edge with power-based execution", "Athleticism maintenance: exceptional fitness across 20+ year career", "Versatility: effective across multiple positions (winger, striker, midfielder)"]'::jsonb
        WHEN 'diego maradona' THEN '["Dribbling genius: closest to unstoppable with ball at feet in confined spaces", "Ball control mastery: intimate touch allowing sudden acceleration and deceleration", "Penalty-taking psychology: mental strength and bravery in decisive moments", "Visionary playmaking: orchestrates attacks from unexpected positions", "Street football instinct: converts tight spaces into scoring opportunities", "Tournament elevation: peaks in World Cup and Copa America competitions", "Physical resilience: plays through injuries and adversity", "Leadership inspiration: elevates entire team performance through personality"]'::jsonb
        WHEN 'johan cruyff' THEN '["Positional intelligence: invents new tactical positions and movement patterns", "Technical sophistication: first-touch control and ball retention at highest level", "System innovation: revolutionizes team structure and play philosophy", "Football IQ: chess-player mentality reading game three moves ahead", "Versatility mastery: plays multiple positions with equal excellence", "Spatial awareness: exploits positioning gaps before they materialize", "Tactical adaptation: adjusts playstyle to counter opponents effectively", "Elegance in execution: makes difficult plays look effortless"]'::jsonb
        WHEN 'pele' THEN '["Goal scoring instinct: 1000+ career goals across all competitions", "Physical prowess: combines strength, speed, and aerial ability", "Positional flexibility: effective across attacking and midfield positions", "Tactical awareness: understands game structure and positioning principles", "Championship mentality: delivers in decisive moments and final matches", "Global impact: brings football to international prominence", "Athletic dominance: physically superior to many contemporaries", "Header expertise: powerful and accurate aerial capability"]'::jsonb
        WHEN 'franz beckenbauer' THEN '["Ball-playing defender: revolutionizes defensive role with offensive contribution", "Leadership magnetism: commanding presence that elevates team coherence", "Positioning mastery: anticipates plays without aggressive challenges", "Elegance in defending: makes defending look graceful and controlled", "Game reading: comprehensive understanding of tactical development", "Sweeper innovation: pioneers libero role that changes modern defense", "Passing range: connects defense to attack with accurate distribution", "Physical intelligence: uses body positioning over brute force"]'::jsonb
        WHEN 'gerd muller' THEN '["Clinical finishing: converts half-chances into goals with lethal precision", "Positioning excellence: always in the right place at the right time", "Clutch performance: delivers in World Cup and Euro tournament matches", "Physical strength: low center of gravity and balance in contact", "Goal instinct: instinctive movement and anticipation of loose balls", "Tournament record: 68 international goals including World Cup victories", "One-touch finishing: deadly accuracy from difficult angles", "Penalty precision: composed and clinical from the spot"]'::jsonb
        WHEN 'andres iniesta' THEN '["Technical mastery: highest passing accuracy and one-touch execution", "Left foot precision: deadly accuracy that makes him unpredictable", "Visionary playmaking: orchestrates midfield from deep positions", "One-touch passing: quick transitions that cut through defenses", "Tournament clutch factor: iconic 2010 World Cup goal in final", "Ball retention: keeps possession in high-pressure situations", "Spatial intelligence: positioning and timing in midfield transitions", "Consistency: rarely has poor matches across entire career"]'::jsonb
        WHEN 'zinedine zidane' THEN '["Heading precision: powerful and accurate headers in clutch moments", "Long-range striking: exceptional technique for powerful distant shots", "Tournament performances: elevates game in World Cup and Champions League finals", "Consistency: rarely makes technical errors despite aggressive style", "Two-footedness: dangerous and accurate with both feet", "Penalty execution: commanding presence with power-based kicks", "Physical strength: combines technical skill with athletic robustness", "Match control: dictates tempo and direction of play"]'::jsonb
        WHEN 'ronaldinho' THEN '["Skill and flair: combines technical ability with entertainment value", "Dribbling brilliance: unpredictable and creative in tight spaces", "Joy of play: maintains enthusiasm and playfulness throughout career", "Positional versatility: adapts to multiple positions effectively", "Game-changing moments: creates magical plays that shift match momentum", "Smile and personality: elevates team morale and opponent respect", "Aerial ability: strong heading and physical presence despite size", "Tactical intelligence: understands spacing and defensive vulnerabilities"]'::jsonb
        WHEN 'ronaldo nazario' THEN '["Speed and power: fastest player ever recorded in tournament football", "Finishing precision: converts chances with explosive athleticism", "Peak athleticism: unmatched physical capabilities during prime years", "Penalty taking: psychological edge and powerful execution", "Physical dominance: overwhelming defenders through pure athleticism", "Acceleration: explosive first step that creates separation", "Heading ability: strong vertical leap despite striker build", "Clutch performance: delivers in World Cup knockout matches"]'::jsonb
        WHEN 'romario' THEN '["Clinical striking: exceptional goal conversion rate across career", "Positioning intelligence: finds space and gaps systematically", "Ball control: close touch and first-touch mastery", "Tournament football: delivers in Copa America and World Cup", "Longevity record: maintains elite performance across 25+ year career", "Clutch goals: scores in important matches and finals", "Physical balance: low center of gravity and body control", "Penalty accuracy: composed and clinical from the spot"]'::jsonb
        WHEN 'marco van basten' THEN '["Striking genius: combines technical skill with athletic presence", "Technique mastery: elegant execution from difficult positions", "Aerial dominance: powerful headers and chest control", "Consistency: rarely has poor performances in crucial matches", "Big-game player: elevates performance in finals and semi-finals", "All-around capability: plays midfielder, striker, and winger effectively", "Injury resilience: returns from major injuries at elite level", "Leadership: quiet authority and team influence"]'::jsonb
        WHEN 'michel platini' THEN '["Heading accuracy: powerful and precise aerial execution", "Consistency level: maintains elite performance across multiple seasons", "Tournament performances: delivers in Euro championships consistently", "Leadership quality: captains teams with authority and respect", "Technical skill: balanced playmaking and goal-scoring ability", "Free-kick execution: powerful and accurate from distance", "Penalty taking: psychological strength and reliable conversion", "Elegance in play: technical sophistication in execution"]'::jsonb
        WHEN 'xavi hernandez' THEN '["Passing accuracy: world-record precision in pass completion", "Positional intelligence: orchestrates play from midfield without ball", "Game control: dictates tempo and defensive shape", "Tournament football: performs at elite level in World Cup and Euro", "Technical perfection: minimizes errors and maximizes efficiency", "Vision range: sees plays and positions before they develop", "Defensive contribution: tracks back and supports defense", "Leadership through action: elevates teammates through play quality"]'::jsonb
        WHEN 'paulo maldini' THEN '["Defensive mastery: reads game and positioning at elite level", "Positioning excellence: anticipates plays without physical challenges", "Consistency record: maintains elite performance across 25+ years", "Longevity secret: proper conditioning and tactical intelligence", "Commanding presence: coordinates defense and provides leadership", "Ball-playing ability: initiates attacks from defensive position", "One-on-one defending: exceptional at shutting down attackers", "Physical elegance: makes defending look controlled and graceful"]'::jsonb
        WHEN 'cafu' THEN '["Pace and endurance: exceptional athleticism maintained across long careers", "Attacking fullback: innovates offensive runs and crosses from defense", "Consistency level: rarely has poor performances in any competition", "Tournament success: delivers in World Cup winning campaigns", "Athleticism peak: maintains physical performance into 40s", "Defensive reliability: solid and dependable in defensive duties", "Leadership presence: commands respect and provides consistency", "Versatility: plays both fullback positions effectively"]'::jsonb
        WHEN 'roberto carlos' THEN '["Left-back revolution: pioneers attacking left-back with free-kick power", "Free-kick power: legendary bending shots from distance", "Speed and athleticism: explosive movement and acceleration", "One-on-one defending: reliable in direct defensive encounters", "Longevity achievement: maintains elite performance across 25 years", "Innovation: transforms fullback position with offensive approach", "Physical presence: intimidates opponents through physicality", "Tournament success: delivers in Copa America and Champions League"]'::jsonb
        WHEN 'kaka' THEN '["Midfielder excellence: combines passing, dribbling, and goal-scoring", "Dribbling ability: carries ball effectively through traffic", "Shooting power: powerful strikes from distance with accuracy", "Tournament performances: delivers in Champions League and World Cup", "Physical attributes: height and strength providing advantage", "Playmaking vision: creates chances from midfielder position", "Penalty taking: reliable conversion from the spot", "Pace and power: combines speed with physical strength"]'::jsonb
        ELSE '["Elite performer: exceptional skill relative to peer group", "Consistency: reliable excellence across multiple seasons", "Technical ability: refined execution in core skills", "Tactical intelligence: understands game structure and positioning", "Impact player: influences match outcomes through performance"]'::jsonb
    END,
    CASE p.normalized_name
        WHEN 'lionel messi' THEN '["8 Ballon d''Or awards (all-time record)", "Copa America 2021 winner", "FIFA World Cup 2022 winner", "7 La Liga titles", "4 UEFA Champions League titles", "619+ career goals", "Multiple team of the year selections", "Exceptional consistency over 20+ years"]'::jsonb
        WHEN 'cristiano ronaldo' THEN '["5 Ballon d''Or awards", "3 UEFA Champions League titles with Real Madrid", "2020 Euro winner (Portugal)", "Multiple league titles (La Liga, Serie A, Premier League)", "750+ career goals", "Consistent 50+ goal per season streaks", "Champions League top scorer multiple times"]'::jsonb
        WHEN 'diego maradona' THEN '["1986 FIFA World Cup winner (led Argentina)", "1990 World Cup runner-up", "2 Serie A titles with Napoli", "Brought Napoli to world prominence", "2 UEFA Cup victories", "Exceptional dribbler and goal creator"]'::jsonb
        WHEN 'johan cruyff' THEN '["3 Ballon d''Or awards", "3 European Cups with Ajax (1971-1973)", "FIFA World Cup finalist (1974)", "La Liga champion with Barcelona", "Pioneer of total football system", "Revolutionized positional play"]'::jsonb
        WHEN 'pele' THEN '["3 FIFA World Cup championships (1958, 1962, 1970)", "1000+ career goals", "Over 100 international goals", "Brought football to global prominence", "Olympic gold medalist", "League titles and continental success"]'::jsonb
        WHEN 'franz beckenbauer' THEN '["Ballon d''Or winner", "World Cup winner 1974 (West Germany)", "Multiple Bundesliga titles", "Defined attacking fullback/defender role", "European Cup winner (1975, 1976)", "Pioneered sweeper system"]'::jsonb
        WHEN 'gerd muller' THEN '["World Cup winner 1974", "Euro 1972 winner", "68 international goals", "Bundesliga leading striker", "Multiple German championships", "Exceptional tournament performances"]'::jsonb
        WHEN 'andres iniesta' THEN '["2010 FIFA World Cup winner (Spain)", "Euro 2012 winner", "9 La Liga titles", "4 UEFA Champions League titles", "2008 Olympic gold medalist", "Iconic Euro 2012 performance"]'::jsonb
        WHEN 'zinedine zidane' THEN '["1998 World Cup winner (France)", "2000 Euro winner", "Champions League winner 1998, 2000, 2002", "Multiple La Liga titles", "Ballon d''Or winner", "Exceptional headers and long-range shots"]'::jsonb
        WHEN 'ronaldinho' THEN '["2002 World Cup winner (Brazil)", "2 Champions League titles", "La Liga titles", "Copa America appearance", "Mesmerizing dribbling displays", "Revolutionized attacking play"]'::jsonb
        WHEN 'ronaldo nazario' THEN '["1994 and 2002 World Cup winner", "2x Ballon d''Or", "264 international goals", "Fastest player ever in tournament football", "Overcoming injuries to still deliver", "Peak athleticism record"]'::jsonb
        WHEN 'romario' THEN '["1994 World Cup winner", "Over 700 career goals", "Multiple Brazilian league titles", "Copa America performances", "Longevity in elite football", "Clutch goal-scorer"]'::jsonb
        WHEN 'marco van basten' THEN '["3 Ballon d''Or awards", "1988 Euro winner (Netherlands)", "Champions League winner 1989, 1990", "Serie A titles", "2 World Cup final appearances", "Peak cut short by injury"]'::jsonb
        WHEN 'michel platini' THEN '["1984 Euro winner", "3 consecutive Ballon d''Or (1983-1985)", "Serie A titles", "European Cup winner 1985", "Championship-winning record", "Outstanding tournament player"]'::jsonb
        WHEN 'xavi hernandez' THEN '["2010 FIFA World Cup winner", "Euro 2008, 2012 winner", "8 La Liga titles", "3 Champions League titles", "World''s best midfielder (2010-2012 consensus)", "Exceptional passing accuracy"]'::jsonb
        WHEN 'paulo maldini' THEN '["7 Serie A titles", "5 Champions League titles", "1994 World Cup finalist", "Defensive excellence over 25 years", "One of the greatest defenders ever", "Consistency and longevity"]'::jsonb
        WHEN 'cafu' THEN '["1994, 2002 World Cup winner (Brazil)", "Copa America 1999 winner", "Champions League winner", "Serie A titles", "Record appearances for Brazil", "Pace and athleticism"]'::jsonb
        WHEN 'roberto carlos' THEN '["2002 World Cup winner", "Copa America 1999 winner", "Champions League 1998, 2000", "Multiple La Liga titles", "Pioneering left-back free-kicks", "Power and innovation"]'::jsonb
        WHEN 'kaka' THEN '["2002 World Cup winner", "UEFA Champions League 2007", "Ballon d''Or 2007", "Multiple Brazilian league titles", "AC Milan impact player", "Peak athletic performance"]'::jsonb
        ELSE '["Professional excellence", "Notable career achievements", "Contributed to major competitions", "Technical mastery", "Elite-level performances"]'::jsonb
    END,
    NOW(),
    'Curated Sports Database'
FROM players p
WHERE p.sport = 'FOOTBALL'
  AND p.current_rank IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM ai_analysis WHERE player_id = p.id
  )
ON CONFLICT (player_id) DO NOTHING;
