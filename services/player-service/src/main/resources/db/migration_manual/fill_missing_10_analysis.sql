-- AI analysis records for the 10 gap-filled football players
INSERT INTO ai_analysis (player_id, ai_rating, analysis_text, biography, strengths, career_highlights, generated_at, llm_model)
SELECT p.id, p.ranking_score,
  CASE p.current_rank
    WHEN 36 THEN 'Ronald Koeman was one of the most lethal free-kick specialists in football history. The Dutch sweeper-turned-striker redefined what a defender could be, scoring goals that would make forwards jealous. His thunderous free kick in the 1992 European Cup final at Wembley gave Barcelona their first-ever European Cup.'
    WHEN 37 THEN 'Luis Suarez is one of the most ruthless and controversial strikers ever to grace the game. At Barcelona, he formed the devastating MSN trident with Messi and Neymar, winning the treble in 2014-15. His 198 goals for Barcelona made him the third-highest scorer in the club history.'
    WHEN 52 THEN 'Wayne Rooney burst onto the scene as a 16-year-old wonderkid and never looked back. Manchester United all-time top scorer with 253 goals, he was the complete forward — powerful, intelligent, and capable of moments of breathtaking genius.'
    WHEN 53 THEN 'Luka Modric is the midfield maestro who proved that elegance trumps physicality. The Croatian magician orchestrated Real Madrid midfield through five Champions League triumphs. His 2018 Ballon d Or broke the Messi-Ronaldo duopoly.'
    WHEN 62 THEN 'Eric Cantona was football philosopher king — part genius, part provocateur, all legend. He arrived at Manchester United in 1992 and single-handedly ignited the Premier League era, inspiring four league titles in five years.'
    WHEN 64 THEN 'Raul was Real Madrid royalty — the boy from the academy who became the club all-time top scorer before Cristiano Ronaldo surpassed him. With 323 goals in 741 appearances, he was the ultimate big-game player.'
    WHEN 65 THEN 'Michael Laudrup was the most elegant playmaker of his generation — a player so smooth that Johan Cruyff called him the best player he ever coached. The Dane graced both Barcelona and Real Madrid with his sublime vision.'
    WHEN 66 THEN 'Kylian Mbappe is the heir apparent to the football throne — a generational talent who burst onto the scene as a teenager and has never stopped accelerating. His hat-trick in the 2022 World Cup final was one of the greatest individual performances ever.'
    WHEN 70 THEN 'Ferenc Puskas was the original goal machine — the Galloping Major whose left foot was a weapon of mass destruction. He scored 84 goals in 85 internationals for Hungary, leading the Mighty Magyars. FIFA named its annual best goal award after him.'
    WHEN 78 THEN 'Samuel Etoo is the greatest African footballer of all time — a devastating striker who conquered Europe with Barcelona and Inter Milan. He won back-to-back Champions League titles with both clubs.'
  END,
  CASE p.current_rank
    WHEN 36 THEN 'Ronald Koeman was one of the most lethal free-kick specialists in football history. The Dutch sweeper redefined what a defender could be. His thunderous free kick in the 1992 European Cup final gave Barcelona their first European Cup.'
    WHEN 37 THEN 'Luis Suarez is one of the most ruthless strikers ever. At Barcelona he formed the devastating MSN trident with Messi and Neymar, winning the treble in 2014-15.'
    WHEN 52 THEN 'Wayne Rooney burst onto the scene as a 16-year-old wonderkid. Manchester United all-time top scorer with 253 goals, the complete forward.'
    WHEN 53 THEN 'Luka Modric is the midfield maestro who proved elegance trumps physicality. Five Champions League triumphs with Real Madrid.'
    WHEN 62 THEN 'Eric Cantona was football philosopher king. He ignited the Premier League era at Manchester United, inspiring four league titles in five years.'
    WHEN 64 THEN 'Raul was Real Madrid royalty. 323 goals in 741 appearances, the ultimate big-game player, scoring in two Champions League finals.'
    WHEN 65 THEN 'Michael Laudrup was the most elegant playmaker of his generation. Johan Cruyff called him the best player he ever coached.'
    WHEN 66 THEN 'Kylian Mbappe is a generational talent. World Cup winner at 19, hat-trick in the 2022 final, blistering pace and clinical finishing.'
    WHEN 70 THEN 'Ferenc Puskas was the Galloping Major. 84 goals in 85 internationals for Hungary. Four goals in the legendary 7-3 European Cup final.'
    WHEN 78 THEN 'Samuel Etoo is the greatest African footballer of all time. Back-to-back Champions League titles with Barcelona and Inter Milan.'
  END,
  CASE p.current_rank
    WHEN 36 THEN '["Devastating free-kick technique","Exceptional passing range from deep","Game-reading ability","Powerful long-range shooting"]'::jsonb
    WHEN 37 THEN '["Predatory instinct in the box","Tireless pressing and work rate","Exceptional dribbling in tight spaces","Clinical finishing with both feet"]'::jsonb
    WHEN 52 THEN '["Explosive power and physicality","Spectacular long-range shooting","Versatility across the forward line","Fierce competitive drive"]'::jsonb
    WHEN 53 THEN '["Sublime ball control and first touch","Visionary passing","Tireless engine covering every blade of grass","Ability to dictate match tempo"]'::jsonb
    WHEN 62 THEN '["Imperious vision and creativity","Spectacular goals in big moments","Magnetic presence elevating teammates","Technical brilliance with physical power"]'::jsonb
    WHEN 64 THEN '["Clinical finishing in biggest matches","Intelligent movement and positioning","Natural leadership","Longevity at the highest level"]'::jsonb
    WHEN 65 THEN '["Unmatched passing vision and range","Elegant dribbling style","Decisive through balls","Composure under pressure"]'::jsonb
    WHEN 66 THEN '["Blistering pace that terrifies defenders","Clinical finishing under pressure","Explosive acceleration","Big-game mentality beyond his years"]'::jsonb
    WHEN 70 THEN '["Legendary left foot with devastating power","Extraordinary goal-scoring record","Natural football intelligence","Performing on the biggest stages"]'::jsonb
    WHEN 78 THEN '["Lightning pace combined with power","Predatory finishing ability","Winning matches single-handedly","Fierce determination and spirit"]'::jsonb
  END,
  CASE p.current_rank
    WHEN 36 THEN '["Scored winning goal in 1992 European Cup final","193 career goals as a defender","1988 European Championship winner","4 Eredivisie titles","6 La Liga titles with Barcelona"]'::jsonb
    WHEN 37 THEN '["198 goals for Barcelona","Treble winner with Barcelona 2014-15","2013-14 Premier League Golden Boot (31 goals)","Copa America 2011 winner","European Golden Shoe 2013-14 and 2015-16"]'::jsonb
    WHEN 52 THEN '["Manchester United all-time top scorer (253 goals)","England all-time top scorer (53 goals)","5 Premier League titles","Champions League winner 2008","Iconic overhead kick vs Man City 2011"]'::jsonb
    WHEN 53 THEN '["2018 Ballon d Or winner","5 Champions League titles with Real Madrid","Led Croatia to 2018 World Cup final","FIFA Best Mens Player 2018","Multiple FIFA FIFPro World XI selections"]'::jsonb
    WHEN 62 THEN '["4 Premier League titles in 5 years","1996 FA Cup final winning goal","FWA Footballer of the Year 1996","PFA Players Player of the Year 1994","Transformed Manchester United"]'::jsonb
    WHEN 64 THEN '["323 goals in 741 appearances for Real Madrid","3 Champions League titles","All-time Champions League top scorer until 2015","6 La Liga titles","44 goals in 102 caps for Spain"]'::jsonb
    WHEN 65 THEN '["Key player in Cruyff Barcelona Dream Team","Won La Liga with both Barcelona AND Real Madrid","104 caps for Denmark","Voted greatest Danish footballer ever","4 consecutive La Liga titles"]'::jsonb
    WHEN 66 THEN '["2018 FIFA World Cup winner at age 19","Hat-trick in 2022 World Cup final","Multiple Ligue 1 top scorer seasons","2018 World Cup Best Young Player","Youngest French WC scorer since Pele"]'::jsonb
    WHEN 70 THEN '["84 goals in 85 internationals for Hungary","4 goals in 1960 European Cup final","Olympic Gold Medal 1952","Hungary 6-3 win over England at Wembley 1953","3 European Cups with Real Madrid","FIFA Puskas Award named after him"]'::jsonb
    WHEN 78 THEN '["Back-to-back Champions League titles (Barca 2006 Inter 2010)","Scored in 2006 Champions League final","3-time African Player of the Year","4 La Liga titles with Barcelona","130 goals for Barcelona"]'::jsonb
  END,
  NOW(),
  'manual-seed-gap-fill'
FROM players p
WHERE p.sport = 'FOOTBALL' AND p.current_rank IN (36, 37, 52, 53, 62, 64, 65, 66, 70, 78)
AND NOT EXISTS (SELECT 1 FROM ai_analysis a WHERE a.player_id = p.id);
