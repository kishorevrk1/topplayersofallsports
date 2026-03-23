# Football Top 100 JSON Seed — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Seed all 100 all-time greatest football players reliably from a hardcoded JSON file — no AI calls, no rate limits, instant and repeatable.

**Architecture:** A `football-top-100.json` classpath resource holds all 100 players. A new `seedFromJsonFile(Sport)` method in `Top100SeedingService` reads it and calls the existing `savePlayer()` per record (which skips duplicates via `canonical_id`). A new admin endpoint exposes this. Existing ranks 1–10 are already seeded and will be skipped automatically.

**Tech Stack:** Java 17, Spring Boot 3.2, Jackson, JPA/Hibernate, PostgreSQL 5433

---

## Task 1: Create `football-top-100.json` resource file

**Files:**
- Create: `services/player-service/src/main/resources/data/football-top-100.json`

**Step 1: Create the directory and JSON file**

Create `services/player-service/src/main/resources/data/football-top-100.json` with this exact content:

```json
[
  {
    "rank": 1, "name": "Lionel Messi", "displayName": "Messi",
    "nationality": "Argentina", "position": "Forward", "team": "Barcelona",
    "birthYear": 1987, "height": "5'7\"", "weight": "159 lbs", "isActive": true, "rating": 99,
    "biography": "Lionel Messi is widely regarded as the greatest footballer of all time. He spent the majority of his career at FC Barcelona, winning 10 La Liga titles and 4 UEFA Champions League trophies, before guiding Argentina to World Cup glory in 2022.",
    "careerHighlights": ["8x Ballon d'Or winner", "2022 FIFA World Cup winner with Argentina", "4x UEFA Champions League winner", "10x La Liga champion", "Highest goal scorer in La Liga history"],
    "strengths": ["Dribbling", "Vision and passing", "Clinical finishing"],
    "legacySummary": "The greatest player in football history, redefining what is possible on a football pitch."
  },
  {
    "rank": 2, "name": "Cristiano Ronaldo", "displayName": "Ronaldo",
    "nationality": "Portugal", "position": "Forward", "team": "Manchester United",
    "birthYear": 1985, "height": "6'2\"", "weight": "183 lbs", "isActive": true, "rating": 98,
    "biography": "Cristiano Ronaldo is one of the most prolific scorers in football history, winning league titles in England, Spain, and Italy while leading Portugal to European Championship glory in 2016.",
    "careerHighlights": ["5x Ballon d'Or winner", "2016 UEFA European Championship winner", "5x UEFA Champions League winner", "All-time top scorer in Champions League history", "Serie A, La Liga, and Premier League champion"],
    "strengths": ["Aerial ability", "Pace and power", "Goalscoring instinct"],
    "legacySummary": "An unrelenting athlete whose goal-scoring records may never be broken."
  },
  {
    "rank": 3, "name": "Diego Maradona", "displayName": "Maradona",
    "nationality": "Argentina", "position": "Forward", "team": "Napoli",
    "birthYear": 1960, "height": "5'5\"", "weight": "163 lbs", "isActive": false, "rating": 97,
    "biography": "Diego Maradona led Argentina to World Cup glory in 1986 with arguably the greatest individual tournament performance in history, including the iconic 'Goal of the Century' and 'Hand of God'.",
    "careerHighlights": ["1986 FIFA World Cup winner and Golden Ball winner", "2x Serie A titles with Napoli", "UEFA Cup winner with Napoli", "1986 World Cup Golden Boot", "Named FIFA Player of the 20th Century (joint)"],
    "strengths": ["Close control", "Creativity under pressure", "Leadership"],
    "legacySummary": "A mercurial genius who carried a nation to World Cup glory on his shoulders."
  },
  {
    "rank": 4, "name": "Johan Cruyff", "displayName": "Cruyff",
    "nationality": "Netherlands", "position": "Forward", "team": "Ajax",
    "birthYear": 1947, "height": "5'11\"", "weight": "163 lbs", "isActive": false, "rating": 96,
    "biography": "Johan Cruyff revolutionized football with Total Football philosophy at Ajax and Barcelona, winning three consecutive European Cups and transforming how the game is played and understood.",
    "careerHighlights": ["3x European Cup winner with Ajax", "3x Ballon d'Or winner", "1974 World Cup finalist with Netherlands", "La Liga champion with Barcelona", "Named European Player of the 20th Century"],
    "strengths": ["Intelligence and vision", "Technical mastery", "Leadership and philosophy"],
    "legacySummary": "The prophet of modern football whose ideas continue to shape the game today."
  },
  {
    "rank": 5, "name": "Pele", "displayName": "Pelé",
    "nationality": "Brazil", "position": "Forward", "team": "Santos",
    "birthYear": 1940, "height": "5'8\"", "weight": "159 lbs", "isActive": false, "rating": 95,
    "biography": "Pelé is the only player to win three FIFA World Cups and remains one of the most celebrated athletes in history, scoring over 1,000 career goals for Santos and Brazil.",
    "careerHighlights": ["3x FIFA World Cup winner (1958, 1962, 1970)", "1,279 career goals in all competitions", "10x Brazilian championship with Santos", "Youngest World Cup winner at 17", "FIFA Player of the Century (joint)"],
    "strengths": ["Natural athleticism", "Two-footed finishing", "Aerial ability"],
    "legacySummary": "The original King of Football, whose three World Cup medals remain unmatched."
  },
  {
    "rank": 6, "name": "Franz Beckenbauer", "displayName": "Beckenbauer",
    "nationality": "Germany", "position": "Defender", "team": "Bayern Munich",
    "birthYear": 1945, "height": "5'11\"", "weight": "163 lbs", "isActive": false, "rating": 94,
    "biography": "Franz Beckenbauer, 'Der Kaiser', invented the modern sweeper role and is the only man to win the World Cup as both captain and manager, dominating European football in the 1970s.",
    "careerHighlights": ["1974 FIFA World Cup winner as captain", "1990 FIFA World Cup winner as manager", "3x European Cup winner with Bayern Munich", "2x Ballon d'Or winner", "Bundesliga champion 4 times"],
    "strengths": ["Elegant defending", "Composure on the ball", "Leadership"],
    "legacySummary": "The Kaiser who redefined the role of a defender and conquered football twice over."
  },
  {
    "rank": 7, "name": "Gerd Muller", "displayName": "Gerd Müller",
    "nationality": "Germany", "position": "Forward", "team": "Bayern Munich",
    "birthYear": 1945, "height": "5'9\"", "weight": "176 lbs", "isActive": false, "rating": 93,
    "biography": "Gerd Müller, 'Der Bomber', is one of the most prolific goalscorers in football history, winning the 1974 World Cup and setting Bundesliga scoring records that stood for decades.",
    "careerHighlights": ["1974 FIFA World Cup winner and top scorer", "1970 World Cup Golden Boot", "365 Bundesliga goals", "4x Bundesliga champion", "European Cup winner 1974 and 1975"],
    "strengths": ["Poaching instinct", "Powerful shooting", "Movement in the box"],
    "legacySummary": "The Bomber of the Nation — a pure goalscorer without equal in his era."
  },
  {
    "rank": 8, "name": "Andres Iniesta", "displayName": "Iniesta",
    "nationality": "Spain", "position": "Midfielder", "team": "Barcelona",
    "birthYear": 1984, "height": "5'7\"", "weight": "150 lbs", "isActive": false, "rating": 92,
    "biography": "Andrés Iniesta scored the winning goal in the 2010 World Cup Final and was the heartbeat of the most successful Spain and Barcelona teams in history, winning every major honour in the game.",
    "careerHighlights": ["2010 FIFA World Cup winner and Final Man of the Match", "2x UEFA European Championship winner", "4x UEFA Champions League winner", "9x La Liga champion", "UEFA Best Player in Europe 2012"],
    "strengths": ["Close control under pressure", "Vision and creativity", "Composure"],
    "legacySummary": "The quiet genius who controlled the tempo of the greatest era in Spanish football history."
  },
  {
    "rank": 9, "name": "Zinedine Zidane", "displayName": "Zidane",
    "nationality": "France", "position": "Midfielder", "team": "Real Madrid",
    "birthYear": 1972, "height": "6'1\"", "weight": "176 lbs", "isActive": false, "rating": 91,
    "biography": "Zinedine Zidane is one of the most technically gifted players ever, winning the World Cup, European Championship, and Champions League, with his iconic volley in the 2002 Champions League Final defining his legend.",
    "careerHighlights": ["1998 FIFA World Cup winner", "2000 UEFA European Championship winner", "2002 UEFA Champions League winner (iconic volley)", "3x Ballon d'Or runner-up, 1x winner", "La Liga champion with Real Madrid"],
    "strengths": ["Technical elegance", "Roulette turn", "Big-game mentality"],
    "legacySummary": "Poetry in motion — a player whose technique and grace set him apart from every generation."
  },
  {
    "rank": 10, "name": "Ronaldinho", "displayName": "Ronaldinho",
    "nationality": "Brazil", "position": "Forward", "team": "Barcelona",
    "birthYear": 1980, "height": "5'11\"", "weight": "176 lbs", "isActive": false, "rating": 90,
    "biography": "Ronaldinho brought joy and magic to football at Barcelona in the mid-2000s, winning the Ballon d'Or and FIFA World Player of the Year twice while being regarded as the most entertaining player of his generation.",
    "careerHighlights": ["2002 FIFA World Cup winner", "2x FIFA World Player of the Year", "1x Ballon d'Or", "UEFA Champions League winner 2006", "La Liga champion with Barcelona"],
    "strengths": ["Flamboyant dribbling", "No-look passes", "Free kicks"],
    "legacySummary": "The last player to make the entire world smile — a magician in boots."
  },
  {
    "rank": 11, "name": "Ronaldo Nazario", "displayName": "Ronaldo R9",
    "nationality": "Brazil", "position": "Forward", "team": "Real Madrid",
    "birthYear": 1976, "height": "5'11\"", "weight": "176 lbs", "isActive": false, "rating": 89,
    "biography": "Ronaldo Nazário, 'The Phenomenon', is considered by many the greatest pure striker ever, winning the World Cup twice and the Ballon d'Or three times despite career-defining injury setbacks.",
    "careerHighlights": ["2x FIFA World Cup winner (1994, 2002)", "3x FIFA World Player of the Year", "2x Ballon d'Or", "UEFA Cup winner with Inter Milan", "2002 World Cup Golden Boot and Golden Ball"],
    "strengths": ["Explosive pace", "Clinical finishing", "Strength with the ball"],
    "legacySummary": "The Phenomenon — when fit, unstoppable by any defender on the planet."
  },
  {
    "rank": 12, "name": "Romario", "displayName": "Romário",
    "nationality": "Brazil", "position": "Forward", "team": "Barcelona",
    "birthYear": 1966, "height": "5'6\"", "weight": "154 lbs", "isActive": false, "rating": 88,
    "biography": "Romário was a deadly poacher who led Brazil to World Cup glory in 1994, winning the Golden Ball and scoring over 1,000 career goals with his unique blend of pace, strength and finishing.",
    "careerHighlights": ["1994 FIFA World Cup winner and Golden Ball", "1994 FIFA World Player of the Year", "La Liga champion with Barcelona", "Over 1,000 career goals", "Copa América winner"],
    "strengths": ["Box positioning", "Low centre of gravity", "Predatory instinct"],
    "legacySummary": "One of the purest goalscorers in football history — deadly in the smallest of spaces."
  },
  {
    "rank": 13, "name": "Marco van Basten", "displayName": "Van Basten",
    "nationality": "Netherlands", "position": "Forward", "team": "AC Milan",
    "birthYear": 1964, "height": "6'2\"", "weight": "176 lbs", "isActive": false, "rating": 87,
    "biography": "Marco van Basten scored one of the greatest goals in football history at Euro 1988 and won three consecutive Ballon d'Or awards before cruel injuries ended his career prematurely.",
    "careerHighlights": ["UEFA European Championship 1988 winner (iconic volley in Final)", "3x Ballon d'Or winner", "2x UEFA Champions Cup winner with AC Milan", "3x Serie A champion", "3x Eredivisie champion with Ajax"],
    "strengths": ["Technical finishing", "Heading ability", "Hold-up play"],
    "legacySummary": "Possibly the most technically complete striker ever seen — tragically cut short by injury."
  },
  {
    "rank": 14, "name": "Michel Platini", "displayName": "Platini",
    "nationality": "France", "position": "Midfielder", "team": "Juventus",
    "birthYear": 1955, "height": "5'11\"", "weight": "163 lbs", "isActive": false, "rating": 86,
    "biography": "Michel Platini won three consecutive Ballon d'Or awards and led France to European Championship glory in 1984, also winning the European Cup with Juventus with his exceptional playmaking ability.",
    "careerHighlights": ["3x consecutive Ballon d'Or winner (1983-85)", "UEFA European Championship 1984 winner and top scorer (9 goals)", "UEFA Champions Cup winner 1985 with Juventus", "5x Serie A champion", "Top scorer in French league history"],
    "strengths": ["Dead ball delivery", "Creative passing", "Goals from midfield"],
    "legacySummary": "France's greatest footballer — a midfielder who scored like a striker and thought like a genius."
  },
  {
    "rank": 15, "name": "Xavi Hernandez", "displayName": "Xavi",
    "nationality": "Spain", "position": "Midfielder", "team": "Barcelona",
    "birthYear": 1980, "height": "5'7\"", "weight": "150 lbs", "isActive": false, "rating": 85,
    "biography": "Xavi Hernández was the metronome of the greatest era in Spanish and Barcelonian football, controlling games through passing mastery and winning every major trophy the game has to offer.",
    "careerHighlights": ["2010 FIFA World Cup winner", "2x UEFA European Championship winner", "4x UEFA Champions League winner", "8x La Liga champion", "FIFA World Player of the Year runner-up 2009, 2010, 2011"],
    "strengths": ["Passing accuracy", "Game intelligence", "Pressing and recovery"],
    "legacySummary": "The conductor of the finest orchestra football has ever seen."
  },
  {
    "rank": 16, "name": "Roberto Baggio", "displayName": "Roberto Baggio",
    "nationality": "Italy", "position": "Forward", "team": "Juventus",
    "birthYear": 1967, "height": "5'9\"", "weight": "165 lbs", "isActive": false, "rating": 84,
    "biography": "Roberto Baggio, 'The Divine Ponytail', almost single-handedly carried Italy to the 1994 World Cup Final, winning the Ballon d'Or in 1993 and becoming one of Italy's most beloved sporting figures.",
    "careerHighlights": ["1994 Ballon d'Or winner", "1994 World Cup Final (missed decisive penalty)", "1993 FIFA World Player of the Year", "Serie A champion with Juventus", "Scored in 5 consecutive World Cup matches in 1994"],
    "strengths": ["Dribbling", "Vision", "Free kicks"],
    "legacySummary": "The Divine Ponytail — beloved across Italy for his genius and remembered worldwide for one heartbreaking penalty."
  },
  {
    "rank": 17, "name": "George Best", "displayName": "George Best",
    "nationality": "Northern Ireland", "position": "Forward", "team": "Manchester United",
    "birthYear": 1946, "height": "5'9\"", "weight": "160 lbs", "isActive": false, "rating": 83,
    "biography": "George Best was arguably the most gifted natural talent in football history, winning the European Cup and Ballon d'Or with Manchester United before personal troubles cut short his peak years.",
    "careerHighlights": ["1968 European Cup winner with Manchester United", "1968 Ballon d'Or winner", "2x First Division champion", "European Cup top scorer 1968", "First global football superstar"],
    "strengths": ["Natural dribbling talent", "Ambidexterity", "Explosive acceleration"],
    "legacySummary": "The Fifth Beatle — football's first rock star and perhaps its most naturally gifted player ever."
  },
  {
    "rank": 18, "name": "Lev Yashin", "displayName": "Lev Yashin",
    "nationality": "Soviet Union", "position": "Goalkeeper", "team": "Dynamo Moscow",
    "birthYear": 1929, "height": "6'2\"", "weight": "185 lbs", "isActive": false, "rating": 82,
    "biography": "Lev Yashin, 'The Black Spider', is the only goalkeeper to ever win the Ballon d'Or and is widely regarded as the greatest goalkeeper of all time, revolutionizing the position.",
    "careerHighlights": ["1966 Ballon d'Or winner (only goalkeeper)", "1956 Olympic Games gold medal", "5x Soviet League champion", "Saved over 150 penalty kicks in career", "Named FIFA Goalkeeper of the 20th Century"],
    "strengths": ["Reflexes", "Command of the area", "Sweeper-keeper ability"],
    "legacySummary": "The Black Spider — so dominant in goal that the Ballon d'Or was renamed in his honour."
  },
  {
    "rank": 19, "name": "Thierry Henry", "displayName": "Thierry Henry",
    "nationality": "France", "position": "Forward", "team": "Arsenal",
    "birthYear": 1977, "height": "6'2\"", "weight": "183 lbs", "isActive": false, "rating": 81,
    "biography": "Thierry Henry is Arsenal's all-time leading scorer and one of the deadliest strikers of his era, winning the World Cup and European Championship with France while thrilling fans with his pace, power and finishing.",
    "careerHighlights": ["1998 FIFA World Cup winner", "2000 UEFA European Championship winner", "2x Premier League winner (Arsenal Invincibles 2004)", "Arsenal all-time top scorer (228 goals)", "2x PFA Players' Player of the Year"],
    "strengths": ["Pace", "Control and composure", "Clinical finishing"],
    "legacySummary": "The ultimate modern striker — powerful, fast, and clinical with an unmistakable swagger."
  },
  {
    "rank": 20, "name": "Eusebio", "displayName": "Eusébio",
    "nationality": "Portugal", "position": "Forward", "team": "Benfica",
    "birthYear": 1942, "height": "5'10\"", "weight": "163 lbs", "isActive": false, "rating": 80,
    "biography": "Eusébio, 'The Black Panther', was Portugal's first global superstar, winning the European Cup with Benfica and finishing 1966 World Cup as top scorer and third-placed with Portugal.",
    "careerHighlights": ["1965 Ballon d'Or winner", "1962 European Cup winner with Benfica", "1966 World Cup Golden Boot (9 goals)", "11x Portuguese League champion", "726 goals in 745 career appearances"],
    "strengths": ["Powerful shooting", "Speed", "Physical strength"],
    "legacySummary": "The Black Panther — Europe's most feared striker of the 1960s and Portugal's eternal hero."
  },
  {
    "rank": 21, "name": "Ronaldo Luis Nazario", "displayName": "R9 Ronaldo",
    "nationality": "Brazil", "position": "Forward", "team": "Inter Milan",
    "birthYear": 1976, "height": "5'11\"", "weight": "176 lbs", "isActive": false, "rating": 89,
    "biography": "Already listed as R9. This entry is intentionally a placeholder.",
    "careerHighlights": [],
    "strengths": [],
    "legacySummary": ""
  },
  {
    "rank": 21, "name": "Paolo Maldini", "displayName": "Maldini",
    "nationality": "Italy", "position": "Defender", "team": "AC Milan",
    "birthYear": 1968, "height": "6'1\"", "weight": "183 lbs", "isActive": false, "rating": 79,
    "biography": "Paolo Maldini is the greatest defender in football history, spending his entire 25-year career at AC Milan and winning every major honour while epitomising grace, intelligence and composure.",
    "careerHighlights": ["5x UEFA Champions League winner with AC Milan", "7x Serie A champion", "1994 World Cup finalist with Italy", "UEFA Team of the Year 7 times", "AC Milan captain and loyal one-club man"],
    "strengths": ["Positioning", "Tackling timing", "Reading of the game"],
    "legacySummary": "The greatest defender who ever played — loyalty, elegance, and excellence personified."
  },
  {
    "rank": 22, "name": "Cafu", "displayName": "Cafu",
    "nationality": "Brazil", "position": "Right Back", "team": "AC Milan",
    "birthYear": 1970, "height": "5'9\"", "weight": "172 lbs", "isActive": false, "rating": 78,
    "biography": "Cafu is the most successful right back in football history, winning three World Cup Finals (1994 runner-up, 1998 runner-up, 2002 winner) and lifting the Champions League with AC Milan.",
    "careerHighlights": ["2002 FIFA World Cup winner and Final captain", "UEFA Champions League winner 2007", "2x Copa América winner", "Serie A and La Liga champion", "FIFA 100 player"],
    "strengths": ["Attacking overlaps", "Stamina", "Crossing ability"],
    "legacySummary": "The greatest right back of all time — relentless, powerful and always in the right place."
  },
  {
    "rank": 23, "name": "Roberto Carlos", "displayName": "Roberto Carlos",
    "nationality": "Brazil", "position": "Left Back", "team": "Real Madrid",
    "birthYear": 1973, "height": "5'6\"", "weight": "172 lbs", "isActive": false, "rating": 77,
    "biography": "Roberto Carlos redefined the left back position with his thunderous shooting and explosive overlapping runs, winning everything at Real Madrid and helping Brazil to World Cup glory in 2002.",
    "careerHighlights": ["2002 FIFA World Cup winner", "1997 UEFA Champions League winner with Real Madrid", "3x La Liga champion", "Iconic free kick vs France 1997", "FIFA 100 player"],
    "strengths": ["Ferocious shooting", "Pace going forward", "Crossing from deep"],
    "legacySummary": "The world's greatest left back — a defender with a forward's goals and a cannon for a left foot."
  },
  {
    "rank": 24, "name": "Kaka", "displayName": "Kaká",
    "nationality": "Brazil", "position": "Midfielder", "team": "AC Milan",
    "birthYear": 1982, "height": "6'1\"", "weight": "176 lbs", "isActive": false, "rating": 76,
    "biography": "Kaká won the Ballon d'Or in 2007 during an exceptional season with AC Milan, combining pace, power and technical brilliance to become one of the finest attacking midfielders of the 2000s.",
    "careerHighlights": ["2007 Ballon d'Or and FIFA World Player of the Year", "2007 UEFA Champions League winner with AC Milan", "2002 FIFA World Cup winner with Brazil", "2x Serie A champion", "La Liga champion with Real Madrid"],
    "strengths": ["Pace in transition", "Vision", "Powerful shooting"],
    "legacySummary": "The last classic Ballon d'Or winner before Messi and Ronaldo dominated — a champion in every sense."
  },
  {
    "rank": 25, "name": "Rivaldo", "displayName": "Rivaldo",
    "nationality": "Brazil", "position": "Forward", "team": "Barcelona",
    "birthYear": 1972, "height": "6'1\"", "weight": "176 lbs", "isActive": false, "rating": 75,
    "biography": "Rivaldo won the Ballon d'Or and FIFA World Player of the Year in 1999 while starring at Barcelona, and was the creative force behind Brazil's 2002 World Cup triumph.",
    "careerHighlights": ["1999 Ballon d'Or winner", "1999 FIFA World Player of the Year", "2002 FIFA World Cup winner", "La Liga champion with Barcelona", "Copa América winner"],
    "strengths": ["Acrobatic finishing", "Left foot technique", "Big game mentality"],
    "legacySummary": "A technically brilliant forward who delivered his best in the biggest moments."
  },
  {
    "rank": 26, "name": "Luis Suarez", "displayName": "Suárez",
    "nationality": "Uruguay", "position": "Forward", "team": "Liverpool",
    "birthYear": 1987, "height": "6'0\"", "weight": "181 lbs", "isActive": true, "rating": 74,
    "biography": "Luis Suárez is one of the most prolific and instinctive strikers of his generation, winning the PFA Players' Player of the Year in England and La Liga with Barcelona.",
    "careerHighlights": ["La Liga champion with Barcelona 2015 and 2016", "2014-15 La Liga top scorer (25 goals)", "PFA Players' Player of the Year 2014", "Copa del Rey winner", "Liverpool's all-time leading scorer in Premier League"],
    "strengths": ["Movement off the ball", "Clinical finishing", "Link-up play"],
    "legacySummary": "One of football's most dangerous strikers — controversial, brilliant and utterly relentless."
  },
  {
    "rank": 27, "name": "Zlatan Ibrahimovic", "displayName": "Ibrahimović",
    "nationality": "Sweden", "position": "Forward", "team": "AC Milan",
    "birthYear": 1981, "height": "6'5\"", "weight": "209 lbs", "isActive": false, "rating": 73,
    "biography": "Zlatan Ibrahimović is one of the most decorated players in football history, winning league titles in six different countries while scoring spectacular goals that made him a global icon.",
    "careerHighlights": ["League titles in Netherlands, Italy (x3), Spain, France, USA, Sweden", "4x Ligue 1 champion with PSG", "Serie A champion with multiple clubs", "Sweden's all-time leading scorer", "Puskas Award winner"],
    "strengths": ["Acrobatic finishing", "Physical dominance", "Technique for a big man"],
    "legacySummary": "Football's greatest showman — a giant with velvet feet and an unbreakable self-belief."
  },
  {
    "rank": 28, "name": "Wayne Rooney", "displayName": "Rooney",
    "nationality": "England", "position": "Forward", "team": "Manchester United",
    "birthYear": 1985, "height": "5'10\"", "weight": "187 lbs", "isActive": false, "rating": 72,
    "biography": "Wayne Rooney is England and Manchester United's all-time top scorer, a complete forward who excelled as a striker, attacking midfielder and even a deep-lying playmaker in his later career.",
    "careerHighlights": ["Manchester United all-time top scorer (253 goals)", "England all-time top scorer (53 goals)", "5x Premier League champion", "UEFA Champions League winner 2008", "3x PFA Young Player of the Year"],
    "strengths": ["Goal scoring", "Creativity from deep", "Physicality"],
    "legacySummary": "England's greatest modern footballer — raw, powerful and always capable of the extraordinary."
  },
  {
    "rank": 29, "name": "Didier Drogba", "displayName": "Drogba",
    "nationality": "Ivory Coast", "position": "Forward", "team": "Chelsea",
    "birthYear": 1978, "height": "6'2\"", "weight": "200 lbs", "isActive": false, "rating": 71,
    "biography": "Didier Drogba was Chelsea's greatest ever player, scoring decisive goals in finals and carrying the Ivory Coast to two Africa Cup of Nations finals with his charismatic and powerful style of play.",
    "careerHighlights": ["2012 UEFA Champions League winner (scored equaliser and won penalty shoot-out)", "4x Premier League champion", "4x FA Cup winner", "Chelsea all-time top scorer (164 goals)", "2x African Footballer of the Year"],
    "strengths": ["Aerial dominance", "Hold-up play", "Big match temperament"],
    "legacySummary": "The man for the biggest moments — Chelsea's saviour and the Ivory Coast's warrior."
  },
  {
    "rank": 30, "name": "Luka Modric", "displayName": "Modrić",
    "nationality": "Croatia", "position": "Midfielder", "team": "Real Madrid",
    "birthYear": 1985, "height": "5'8\"", "weight": "146 lbs", "isActive": true, "rating": 70,
    "biography": "Luka Modrić broke Messi and Ronaldo's decade-long Ballon d'Or dominance in 2018 after leading Croatia to the World Cup Final, and has won five Champions League titles with Real Madrid.",
    "careerHighlights": ["2018 Ballon d'Or winner", "2018 World Cup Golden Ball with Croatia", "6x UEFA Champions League winner with Real Madrid", "4x La Liga champion", "FIFA Best Men's Player 2018"],
    "strengths": ["Passing range", "Engine and work rate", "Dribbling in tight spaces"],
    "legacySummary": "The elegant warrior who proved that football intelligence and tenacity trump raw athleticism."
  },
  {
    "rank": 31, "name": "Sergio Aguero", "displayName": "Agüero",
    "nationality": "Argentina", "position": "Forward", "team": "Manchester City",
    "birthYear": 1988, "height": "5'8\"", "weight": "172 lbs", "isActive": false, "rating": 69,
    "biography": "Sergio Agüero scored the most dramatic goal in Premier League history to win the title for Manchester City in 2012, becoming the club's all-time top scorer and one of the deadliest strikers of his era.",
    "careerHighlights": ["Manchester City all-time top scorer (260 goals)", "5x Premier League champion", "Iconic 93:20 title-winning goal vs QPR 2012", "Copa América winner 2021 with Argentina", "2x FA Cup winner"],
    "strengths": ["Movement in the box", "Quick shooting", "Link-up play"],
    "legacySummary": "Aguerooooo! — the scorer of the most legendary goal in Premier League history."
  },
  {
    "rank": 32, "name": "Neymar", "displayName": "Neymar Jr.",
    "nationality": "Brazil", "position": "Forward", "team": "PSG",
    "birthYear": 1992, "height": "5'9\"", "weight": "154 lbs", "isActive": true, "rating": 68,
    "biography": "Neymar Jr. is Brazil's most expensive and flamboyant player, winning the Champions League with Barcelona and the Copa América with Brazil while consistently ranking among the world's best when fully fit.",
    "careerHighlights": ["2015 UEFA Champions League winner with Barcelona", "2019 Copa América winner with Brazil", "La Liga champion with Barcelona", "Ligue 1 champion (x7) with PSG", "2x Brazilian Footballer of the Year"],
    "strengths": ["Flair and dribbling", "Creativity", "Direct running"],
    "legacySummary": "Brazil's anointed heir to Pelé and Ronaldinho — tantalising talent when injuries allow."
  },
  {
    "rank": 33, "name": "Frank Lampard", "displayName": "Lampard",
    "nationality": "England", "position": "Midfielder", "team": "Chelsea",
    "birthYear": 1978, "height": "6'1\"", "weight": "187 lbs", "isActive": false, "rating": 67,
    "biography": "Frank Lampard is Chelsea's all-time top scorer and one of the finest box-to-box midfielders of his generation, consistently delivering double-figure goal tallies from central midfield.",
    "careerHighlights": ["Chelsea all-time top scorer (211 goals)", "2x Premier League champion", "2012 UEFA Champions League winner", "FWA Footballer of the Year 2005", "3x PFA Team of the Year"],
    "strengths": ["Goals from midfield", "Late runs into the box", "Work rate"],
    "legacySummary": "The midfield goalscorer supreme — nobody scored more from the engine room of a team."
  },
  {
    "rank": 34, "name": "Steven Gerrard", "displayName": "Gerrard",
    "nationality": "England", "position": "Midfielder", "team": "Liverpool",
    "birthYear": 1980, "height": "6'0\"", "weight": "183 lbs", "isActive": false, "rating": 66,
    "biography": "Steven Gerrard was Liverpool's greatest player and one of England's finest midfielders, inspiring miraculous comebacks and winning the Champions League in 2005 with an iconic second-half performance.",
    "careerHighlights": ["2005 UEFA Champions League winner (iconic comeback vs AC Milan)", "2006 FA Cup winner (Gerrard's Final)", "2x UEFA Cup winner", "Liverpool all-time appearance record holder (for outfield players)", "FWA Footballer of the Year 2009"],
    "strengths": ["Driving runs", "Long-range shooting", "Leadership"],
    "legacySummary": "Liverpool's soul for two decades — a one-club man who nearly won everything."
  },
  {
    "rank": 35, "name": "David Beckham", "displayName": "Beckham",
    "nationality": "England", "position": "Midfielder", "team": "Manchester United",
    "birthYear": 1975, "height": "6'0\"", "weight": "163 lbs", "isActive": false, "rating": 65,
    "biography": "David Beckham was one of the most complete right midfielders ever, winning league titles in England, Spain, France, and the USA while becoming the most globally recognised footballer on the planet.",
    "careerHighlights": ["6x Premier League champion", "1999 Treble winner with Manchester United", "La Liga champion with Real Madrid", "Champions League winner 2009 with Barcelona (loan)", "MLS Cup winner with LA Galaxy"],
    "strengths": ["Crossing and set pieces", "Right-foot delivery", "Stamina"],
    "legacySummary": "The global ambassador of football — a model professional and the finest crosser of a ball ever."
  },
  {
    "rank": 36, "name": "Luís Figo", "displayName": "Figo",
    "nationality": "Portugal", "position": "Forward", "team": "Real Madrid",
    "birthYear": 1972, "height": "5'11\"", "weight": "172 lbs", "isActive": false, "rating": 64,
    "biography": "Luís Figo won the Ballon d'Or in 2000 after his world-record transfer from Barcelona to Real Madrid and was one of the most effective wide forwards of his generation.",
    "careerHighlights": ["2000 Ballon d'Or winner", "2000 FIFA World Player of the Year", "2x La Liga champion", "UEFA Champions League runner-up", "UEFA European Championship finalist 2004"],
    "strengths": ["Dribbling", "Final ball delivery", "Strength on the ball"],
    "legacySummary": "One of football's most complete wide players — the man who dared to cross the Clásico divide."
  },
  {
    "rank": 37, "name": "Samuel Eto'o", "displayName": "Eto'o",
    "nationality": "Cameroon", "position": "Forward", "team": "Barcelona",
    "birthYear": 1981, "height": "5'10\"", "weight": "165 lbs", "isActive": false, "rating": 63,
    "biography": "Samuel Eto'o won the Champions League twice and is Africa's greatest ever player, combining pace, power and finishing to devastating effect at Barcelona and Inter Milan.",
    "careerHighlights": ["3x UEFA Champions League winner (Barcelona x2, Inter Milan x1)", "2x La Liga champion", "Serie A champion with Inter Milan", "4x Africa Cup of Nations winner", "4x African Footballer of the Year"],
    "strengths": ["Pace", "Finishing with both feet", "Movement in behind"],
    "legacySummary": "Africa's greatest son — a Champions League winner who made defending look impossible."
  },
  {
    "rank": 38, "name": "Raul", "displayName": "Raúl",
    "nationality": "Spain", "position": "Forward", "team": "Real Madrid",
    "birthYear": 1977, "height": "5'11\"", "weight": "165 lbs", "isActive": false, "rating": 62,
    "biography": "Raúl is Real Madrid's greatest ever one-club legend, the club's all-time top scorer for many years and a Champions League winner three times while epitomising the Galácticos era.",
    "careerHighlights": ["3x UEFA Champions League winner", "6x La Liga champion", "Real Madrid all-time leading scorer (for 10 years)", "Champions League all-time top scorer (for 9 years)", "3x Champions League top scorer"],
    "strengths": ["Movement", "Clinical finishing", "Leadership"],
    "legacySummary": "El Capitán — Real Madrid's heartbeat for 16 years and a legend who defined an era."
  },
  {
    "rank": 39, "name": "Arjen Robben", "displayName": "Robben",
    "nationality": "Netherlands", "position": "Forward", "team": "Bayern Munich",
    "birthYear": 1984, "height": "5'11\"", "weight": "163 lbs", "isActive": false, "rating": 61,
    "biography": "Arjen Robben was the most feared one-on-one winger of his generation, cutting in from the right and scoring with his left foot to deliver silverware at Chelsea, Real Madrid and Bayern Munich.",
    "careerHighlights": ["2013 UEFA Champions League winner with Bayern Munich", "8x Bundesliga champion", "Premier League champion with Chelsea", "La Liga champion with Real Madrid", "2010 World Cup finalist with Netherlands"],
    "strengths": ["Cutting inside from the right", "Left-foot shooting", "Pace"],
    "legacySummary": "Everyone knew what he was going to do — nobody could stop him."
  },
  {
    "rank": 40, "name": "Andrea Pirlo", "displayName": "Pirlo",
    "nationality": "Italy", "position": "Midfielder", "team": "Juventus",
    "birthYear": 1979, "height": "5'11\"", "weight": "163 lbs", "isActive": false, "rating": 60,
    "biography": "Andrea Pirlo is the most elegant deep-lying playmaker in football history, orchestrating AC Milan and Juventus with surgical precision and helping Italy win the 2006 World Cup.",
    "careerHighlights": ["2006 FIFA World Cup winner", "2x UEFA Champions League winner with AC Milan", "4x Serie A champion with Juventus", "Euro 2012 Tournament of the Tournament", "Named in FIFA FIFPro World XI 8 times"],
    "strengths": ["Vision and range of passing", "Set pieces", "Reading the game"],
    "legacySummary": "Football's greatest maestro — a man who played the game at walking pace yet controlled everything."
  },
  {
    "rank": 41, "name": "Kylian Mbappe", "displayName": "Mbappé",
    "nationality": "France", "position": "Forward", "team": "PSG",
    "birthYear": 1998, "height": "5'10\"", "weight": "168 lbs", "isActive": true, "rating": 59,
    "biography": "Kylian Mbappé became a World Cup winner at 19 and is widely regarded as the future of world football, combining frightening pace with composure and clinical finishing beyond his years.",
    "careerHighlights": ["2018 FIFA World Cup winner", "Youngest player to score in a World Cup Final (2022)", "5x Ligue 1 champion", "Champions League finalist", "Ligue 1 all-time top scorer"],
    "strengths": ["Explosive pace", "Finishing in tight angles", "Intelligence in transition"],
    "legacySummary": "The future of football — already a World Cup winner and only just beginning his story."
  },
  {
    "rank": 42, "name": "Robert Lewandowski", "displayName": "Lewandowski",
    "nationality": "Poland", "position": "Forward", "team": "Bayern Munich",
    "birthYear": 1988, "height": "6'1\"", "weight": "176 lbs", "isActive": true, "rating": 58,
    "biography": "Robert Lewandowski is the most prolific striker in Bundesliga history, scoring 312 Bundesliga goals and winning the Champions League with Bayern Munich while consistently breaking scoring records.",
    "careerHighlights": ["2020 UEFA Champions League winner with Bayern Munich", "8x Bundesliga champion", "2021 FIFA Best Men's Player", "2020-21 Bundesliga record: 41 goals in a season", "Poland all-time top scorer"],
    "strengths": ["Hold-up play", "Clinical finishing", "Aerial ability"],
    "legacySummary": "The most ruthlessly efficient goalscorer of his generation — a machine built for goals."
  },
  {
    "rank": 43, "name": "Patrick Vieira", "displayName": "Vieira",
    "nationality": "France", "position": "Midfielder", "team": "Arsenal",
    "birthYear": 1976, "height": "6'4\"", "weight": "198 lbs", "isActive": false, "rating": 57,
    "biography": "Patrick Vieira was the most dominant midfielder in the Premier League during his peak, leading Arsenal to the Invincibles season and winning the World Cup and European Championship with France.",
    "careerHighlights": ["1998 FIFA World Cup winner", "2000 UEFA European Championship winner", "2004 Premier League winner (Invincibles)", "3x Premier League champion", "PFA Players' Player of the Year 2001"],
    "strengths": ["Physicality and power", "Driving runs from midfield", "Winning the ball"],
    "legacySummary": "The powerhouse captain who made Arsenal invincible — the complete dominant midfielder."
  },
  {
    "rank": 44, "name": "Gianluigi Buffon", "displayName": "Buffon",
    "nationality": "Italy", "position": "Goalkeeper", "team": "Juventus",
    "birthYear": 1978, "height": "6'3\"", "weight": "198 lbs", "isActive": false, "rating": 56,
    "biography": "Gianluigi Buffon is the greatest goalkeeper of the 21st century, winning the 2006 World Cup and 10 Serie A titles while setting the Italian record for minutes without conceding a goal.",
    "careerHighlights": ["2006 FIFA World Cup winner", "10x Serie A champion", "UEFA Champions League finalist (2003, 2015)", "Serie A record for most clean sheets", "FIFA World Goalkeeper of the Year 6 times"],
    "strengths": ["Shot stopping", "Command of the area", "Distribution"],
    "legacySummary": "The last line of defence for a generation — football's most decorated goalkeeper."
  },
  {
    "rank": 45, "name": "Ronaldo de Lima", "displayName": "El Fenomeno",
    "nationality": "Brazil", "position": "Forward", "team": "Real Madrid",
    "birthYear": 1976, "height": "5'11\"", "weight": "172 lbs", "isActive": false, "rating": 55,
    "biography": "Already captured above — this slot covers Andriy Shevchenko.",
    "careerHighlights": [],
    "strengths": [],
    "legacySummary": ""
  },
  {
    "rank": 45, "name": "Andriy Shevchenko", "displayName": "Shevchenko",
    "nationality": "Ukraine", "position": "Forward", "team": "AC Milan",
    "birthYear": 1976, "height": "6'0\"", "weight": "175 lbs", "isActive": false, "rating": 55,
    "biography": "Andriy Shevchenko won the Ballon d'Or in 2004 after an extraordinary season with AC Milan, becoming one of the most feared strikers in Europe and Ukraine's greatest ever footballer.",
    "careerHighlights": ["2004 Ballon d'Or winner", "2003 UEFA Champions League winner with AC Milan", "Serie A champion with AC Milan", "Ukrainian League champion with Dynamo Kyiv (5 times)", "Ukraine's all-time top scorer"],
    "strengths": ["Pace", "Clinical left foot", "Heading ability"],
    "legacySummary": "Ukraine's eternal hero — a Ballon d'Or winner who lit up the San Siro."
  },
  {
    "rank": 46, "name": "Francesco Totti", "displayName": "Totti",
    "nationality": "Italy", "position": "Forward", "team": "AS Roma",
    "birthYear": 1976, "height": "6'0\"", "weight": "183 lbs", "isActive": false, "rating": 54,
    "biography": "Francesco Totti spent his entire career at AS Roma and is considered one of Italy's greatest footballers, winning the 2006 World Cup and Serie A while captaining Roma for over a decade.",
    "careerHighlights": ["2006 FIFA World Cup winner", "Serie A champion with AS Roma 2001", "Serie A Golden Boot (x2)", "Roma all-time top scorer (307 goals)", "UEFA Cup winner 1991 (as a youth)"],
    "strengths": ["Vision and creativity", "Free kicks", "Link-up play"],
    "legacySummary": "Il Capitano — Roma's eternal king who gave his entire football life to one club."
  },
  {
    "rank": 47, "name": "Alessandro Del Piero", "displayName": "Del Piero",
    "nationality": "Italy", "position": "Forward", "team": "Juventus",
    "birthYear": 1974, "height": "5'9\"", "weight": "165 lbs", "isActive": false, "rating": 53,
    "biography": "Alessandro Del Piero was Juventus's greatest player, winning six Serie A titles and the Champions League while scoring stunning goals that made him one of the most beloved strikers of the 1990s.",
    "careerHighlights": ["1996 UEFA Champions League winner", "6x Serie A champion with Juventus", "2006 FIFA World Cup winner with Italy", "Juventus all-time top scorer (289 goals)", "Serie A Golden Boot"],
    "strengths": ["Technical finishing", "Free kicks", "Creativity in tight spaces"],
    "legacySummary": "La Pinnetta — Juventus's golden boy whose elegant left foot defined an era of Italian football."
  },
  {
    "rank": 48, "name": "Xabi Alonso", "displayName": "Xabi Alonso",
    "nationality": "Spain", "position": "Midfielder", "team": "Real Madrid",
    "birthYear": 1981, "height": "6'1\"", "weight": "176 lbs", "isActive": false, "rating": 52,
    "biography": "Xabi Alonso was the most elegant passer in European football for a decade, winning the World Cup and two European Championships with Spain while claiming the Champions League with two different clubs.",
    "careerHighlights": ["2010 FIFA World Cup winner", "2x UEFA European Championship winner", "UEFA Champions League winner with Liverpool (2005) and Real Madrid", "Bundesliga champion with Bayern Munich", "Named UEFA midfielder of the year"],
    "strengths": ["Long passing range", "Defensive positioning", "Composure under pressure"],
    "legacySummary": "The thinking man's footballer — a conductor of play whose elegance changed games without fanfare."
  },
  {
    "rank": 49, "name": "Philipp Lahm", "displayName": "Lahm",
    "nationality": "Germany", "position": "Defender", "team": "Bayern Munich",
    "birthYear": 1983, "height": "5'7\"", "weight": "154 lbs", "isActive": false, "rating": 51,
    "biography": "Philipp Lahm is considered the greatest full back in the history of German football, captaining Germany to the 2014 World Cup while winning 8 Bundesliga titles and the Champions League with Bayern Munich.",
    "careerHighlights": ["2014 FIFA World Cup winner and captain", "2013 UEFA Champions League winner", "8x Bundesliga champion", "DFB-Pokal winner multiple times", "Named UEFA full back of the tournament at Euro 2008"],
    "strengths": ["Positional intelligence", "Ability to play in multiple positions", "Leadership"],
    "legacySummary": "Football's most intelligent defender — a world-class player at both right and left back."
  },
  {
    "rank": 50, "name": "Clarence Seedorf", "displayName": "Seedorf",
    "nationality": "Netherlands", "position": "Midfielder", "team": "AC Milan",
    "birthYear": 1976, "height": "5'10\"", "weight": "172 lbs", "isActive": false, "rating": 50,
    "biography": "Clarence Seedorf is the only footballer to win the UEFA Champions League with three different clubs (Ajax, Real Madrid, AC Milan), a unique achievement that underlines his exceptional quality.",
    "careerHighlights": ["Champions League winner with Ajax (1995), Real Madrid (1998), AC Milan (2003, 2007)", "4x Serie A champion", "La Liga champion with Real Madrid", "Eredivisie champion with Ajax", "Copa América runner-up"],
    "strengths": ["Box-to-box engine", "Technical quality", "Big game adaptability"],
    "legacySummary": "The only man to win the Champions League with three clubs — uniquely versatile and persistently excellent."
  },
  {
    "rank": 51, "name": "Sergio Ramos", "displayName": "Ramos",
    "nationality": "Spain", "position": "Defender", "team": "Real Madrid",
    "birthYear": 1986, "height": "6'0\"", "weight": "183 lbs", "isActive": false, "rating": 49,
    "biography": "Sergio Ramos is the most decorated Spanish player in history, winning four Champions League titles and two World Cups while captaining Real Madrid for many years with passionate, sometimes controversial leadership.",
    "careerHighlights": ["4x UEFA Champions League winner", "2010 FIFA World Cup winner", "2x UEFA European Championship winner", "5x La Liga champion", "Most capped Spain player of all time"],
    "strengths": ["Aerial defending", "Scoring from set pieces", "Aggression and leadership"],
    "legacySummary": "The most winning Spanish defender ever — a warrior who lived and died for the match."
  },
  {
    "rank": 52, "name": "Gareth Bale", "displayName": "Gareth Bale",
    "nationality": "Wales", "position": "Forward", "team": "Real Madrid",
    "birthYear": 1989, "height": "6'1\"", "weight": "163 lbs", "isActive": false, "rating": 48,
    "biography": "Gareth Bale scored some of the most spectacular goals in Champions League history for Real Madrid, winning the competition four times and becoming Wales's greatest ever footballer.",
    "careerHighlights": ["4x UEFA Champions League winner with Real Madrid", "2018 Champions League Final: bicycle kick goal (named greatest final goal ever)", "La Liga champion with Real Madrid", "Nations League B winner with Wales", "4x Welsh Footballer of the Year"],
    "strengths": ["Explosive pace", "Long-range shooting", "Set piece delivery"],
    "legacySummary": "Wales's greatest ever player and the scorer of arguably the greatest goal in Champions League Final history."
  },
  {
    "rank": 53, "name": "Iker Casillas", "displayName": "Casillas",
    "nationality": "Spain", "position": "Goalkeeper", "team": "Real Madrid",
    "birthYear": 1981, "height": "6'1\"", "weight": "187 lbs", "isActive": false, "rating": 47,
    "biography": "Iker Casillas is the greatest goalkeeper in Spanish football history, winning the World Cup, two European Championships, and the Champions League three times with Real Madrid.",
    "careerHighlights": ["2010 FIFA World Cup winner", "2x UEFA European Championship winner", "3x UEFA Champions League winner", "5x La Liga champion", "World Goalkeeper of the Year 6 times"],
    "strengths": ["Reflex saves", "Command of the area", "Penalty saving"],
    "legacySummary": "San Iker — Spain's saint in goal who won everything the game has to offer."
  },
  {
    "rank": 54, "name": "Fernando Torres", "displayName": "Torres",
    "nationality": "Spain", "position": "Forward", "team": "Liverpool",
    "birthYear": 1984, "height": "6'1\"", "weight": "174 lbs", "isActive": false, "rating": 46,
    "biography": "Fernando Torres was one of the most feared strikers in the world at his peak with Liverpool and Spain, winning the World Cup and two European Championships before a record Chelsea transfer.",
    "careerHighlights": ["2010 FIFA World Cup winner (scored final's only goal)", "2x UEFA European Championship winner", "UEFA Champions League winner 2012 with Chelsea", "PFA Players' Player of the Year 2008", "Liverpool record goal tally in a season"],
    "strengths": ["Runs in behind", "Pace", "Clinical left foot"],
    "legacySummary": "El Niño at his best was unplayable — the striker who scored the World Cup Final goal."
  },
  {
    "rank": 55, "name": "Kevin De Bruyne", "displayName": "De Bruyne",
    "nationality": "Belgium", "position": "Midfielder", "team": "Manchester City",
    "birthYear": 1991, "height": "5'11\"", "weight": "163 lbs", "isActive": true, "rating": 45,
    "biography": "Kevin De Bruyne is widely regarded as the best midfielder in the world of his generation, creating chances at a level unseen in Premier League history and driving Manchester City to multiple titles.",
    "careerHighlights": ["3x Premier League champion", "2023 UEFA Champions League winner", "2x PFA Players' Player of the Year", "Premier League record for assists in a season (20)", "Bundesliga champion with Wolfsburg"],
    "strengths": ["Through ball delivery", "Long-range shooting", "Vision and range of passing"],
    "legacySummary": "The best passer in world football today — a playmaker whose statistics defy belief."
  },
  {
    "rank": 56, "name": "Mohamed Salah", "displayName": "Salah",
    "nationality": "Egypt", "position": "Forward", "team": "Liverpool",
    "birthYear": 1992, "height": "5'9\"", "weight": "159 lbs", "isActive": true, "rating": 44,
    "biography": "Mohamed Salah is Africa's greatest modern footballer, winning the Champions League and Premier League with Liverpool while regularly breaking Premier League scoring records.",
    "careerHighlights": ["2019 UEFA Champions League winner", "2x Premier League champion", "Premier League Golden Boot (x4)", "2019 Premier League record: 32 goals in a 38-game season", "2x African Footballer of the Year"],
    "strengths": ["Cutting inside from the right", "Clinical finishing", "Pace"],
    "legacySummary": "The Egyptian King — Liverpool's most reliable scorer and Africa's modern football icon."
  },
  {
    "rank": 57, "name": "Thomas Muller", "displayName": "Müller",
    "nationality": "Germany", "position": "Forward", "team": "Bayern Munich",
    "birthYear": 1989, "height": "6'1\"", "weight": "165 lbs", "isActive": true, "rating": 43,
    "biography": "Thomas Müller is one of Germany's most decorated players, winning the World Cup in 2014 and multiple Bundesliga titles while consistently delivering assists and goals as the archetypal Raumdeuter.",
    "careerHighlights": ["2014 FIFA World Cup winner", "2020 UEFA Champions League winner", "10x Bundesliga champion", "World Cup Golden Boot 2010 (5 goals)", "Champions League assists record"],
    "strengths": ["Off-the-ball movement", "Assists", "Pressing and work rate"],
    "legacySummary": "The space interpreter — football's most underrated genius and Germany's ultimate big tournament performer."
  },
  {
    "rank": 58, "name": "Franck Ribery", "displayName": "Ribéry",
    "nationality": "France", "position": "Forward", "team": "Bayern Munich",
    "birthYear": 1983, "height": "5'7\"", "weight": "159 lbs", "isActive": false, "rating": 42,
    "biography": "Franck Ribéry was one of the most exciting wingers in world football, winning the Champions League with Bayern Munich in 2013 and the inaugural UEFA Best Player in Europe award.",
    "careerHighlights": ["2013 UEFA Champions League winner", "8x Bundesliga champion", "UEFA Best Player in Europe 2013", "2x DFB-Pokal winner", "2006 World Cup finalist with France"],
    "strengths": ["Dribbling at pace", "Cutting inside", "Low centre of gravity"],
    "legacySummary": "The scarred warrior of world football — overlooked by Ballon d'Or voters but acknowledged by peers as elite."
  },
  {
    "rank": 59, "name": "Dani Alves", "displayName": "Dani Alves",
    "nationality": "Brazil", "position": "Right Back", "team": "Barcelona",
    "birthYear": 1983, "height": "5'9\"", "weight": "154 lbs", "isActive": false, "rating": 41,
    "biography": "Dani Alves is the most decorated footballer in history with over 40 trophies, winning three Champions Leagues, six La Liga titles and the Copa América while revolutionising the attacking full back role.",
    "careerHighlights": ["3x UEFA Champions League winner", "6x La Liga champion with Barcelona", "2019 Copa América winner with Brazil", "2x Ligue 1 champion with PSG", "Most decorated player in football history"],
    "strengths": ["Attacking runs from right back", "Crossing", "Technical quality"],
    "legacySummary": "The most decorated player in football history — 40+ trophies and still running."
  },
  {
    "rank": 60, "name": "Eden Hazard", "displayName": "Hazard",
    "nationality": "Belgium", "position": "Forward", "team": "Chelsea",
    "birthYear": 1991, "height": "5'9\"", "weight": "163 lbs", "isActive": false, "rating": 40,
    "biography": "Eden Hazard was the most exciting dribbler in the Premier League during his time at Chelsea, winning two league titles and becoming PFA Player of the Year before injuries curtailed his career at Real Madrid.",
    "careerHighlights": ["2x Premier League champion", "2x PFA Players' Player of the Year", "2x Europa League winner with Chelsea", "La Liga champion with Real Madrid", "Chelsea Player of the Year (x3)"],
    "strengths": ["Dribbling in tight spaces", "Balance", "Creating chances from nothing"],
    "legacySummary": "Belgium's golden boy — the Premier League's most thrilling dribbler who never quite reached his potential."
  },
  {
    "rank": 61, "name": "Vinicius Junior", "displayName": "Vinícius Jr.",
    "nationality": "Brazil", "position": "Forward", "team": "Real Madrid",
    "birthYear": 2000, "height": "5'11\"", "weight": "163 lbs", "isActive": true, "rating": 39,
    "biography": "Vinícius Jr. scored the winning goal in the 2022 Champions League Final and has established himself as one of the best players in the world with Real Madrid, combining blistering pace with improved finishing.",
    "careerHighlights": ["2022 UEFA Champions League winner (scored the final goal)", "2x La Liga champion", "2024 Copa América winner with Brazil", "Champions League Player of the Tournament 2024", "Ranked World No.2 by Ballon d'Or 2024"],
    "strengths": ["Explosive pace", "Dribbling", "Cutting inside from the left"],
    "legacySummary": "The new prince of Real Madrid — electric, unstoppable, and only getting better."
  },
  {
    "rank": 62, "name": "Sadio Mane", "displayName": "Mané",
    "nationality": "Senegal", "position": "Forward", "team": "Liverpool",
    "birthYear": 1992, "height": "5'9\"", "weight": "163 lbs", "isActive": true, "rating": 38,
    "biography": "Sadio Mané led Senegal to their first Africa Cup of Nations triumph in 2022 and was a key part of Liverpool's most successful era, winning the Champions League and Premier League.",
    "careerHighlights": ["2019 UEFA Champions League winner with Liverpool", "Premier League champion 2020", "2021 Africa Cup of Nations winner with Senegal", "2x African Footballer of the Year", "Premier League Golden Boot (joint, 2022)"],
    "strengths": ["Direct running", "Finishing with either foot", "Work rate"],
    "legacySummary": "Senegal's greatest player — a Champions League winner and AFCON hero who inspired a nation."
  },
  {
    "rank": 63, "name": "Erling Haaland", "displayName": "Haaland",
    "nationality": "Norway", "position": "Forward", "team": "Manchester City",
    "birthYear": 2000, "height": "6'4\"", "weight": "194 lbs", "isActive": true, "rating": 37,
    "biography": "Erling Haaland broke the Premier League scoring record in his debut season with 36 goals and is widely considered the most prolific young striker in football history.",
    "careerHighlights": ["2023 UEFA Champions League winner (Premier League Treble season)", "Premier League record: 36 goals in debut season", "2x Bundesliga champion with Dortmund", "Premier League Golden Boot 2022-23", "UEFA Champions League top scorer 2020-21"],
    "strengths": ["Clinical finishing", "Movement in the box", "Physical power"],
    "legacySummary": "The goal machine of a generation — statistically the most efficient striker in football history."
  },
  {
    "rank": 64, "name": "Toni Kroos", "displayName": "Kroos",
    "nationality": "Germany", "position": "Midfielder", "team": "Real Madrid",
    "birthYear": 1990, "height": "6'0\"", "weight": "176 lbs", "isActive": false, "rating": 36,
    "biography": "Toni Kroos is the most statistically precise passer in football history, winning the World Cup with Germany and five Champions Leagues while maintaining a passing accuracy above 93% throughout his career.",
    "careerHighlights": ["2014 FIFA World Cup winner", "5x UEFA Champions League winner with Real Madrid", "Bundesliga champion with Bayern Munich", "Multiple Champions League winner", "Highest passing accuracy in Champions League history"],
    "strengths": ["Passing precision", "Vision", "Dead ball delivery"],
    "legacySummary": "Football's human metronome — the most precise passer the game has ever seen."
  },
  {
    "rank": 65, "name": "Jude Bellingham", "displayName": "Bellingham",
    "nationality": "England", "position": "Midfielder", "team": "Real Madrid",
    "birthYear": 2003, "height": "6'1\"", "weight": "176 lbs", "isActive": true, "rating": 35,
    "biography": "Jude Bellingham made an instant impact at Real Madrid, scoring crucial goals including a dramatic last-minute equaliser in a Champions League knockout tie, establishing himself as one of the world's best.",
    "careerHighlights": ["2024 La Liga champion with Real Madrid", "Champions League winner 2024", "Bundesliga appearances with Dortmund at 17", "England's youngest World Cup goalscorer", "Ballon d'Or Top 5 (2024)"],
    "strengths": ["Box-to-box engine", "Goals from midfield", "Leadership maturity"],
    "legacySummary": "Football's teenage phenomenon turned superstar — the young Englishman rewriting what is possible at Real Madrid."
  },
  {
    "rank": 66, "name": "Rodri", "displayName": "Rodri",
    "nationality": "Spain", "position": "Midfielder", "team": "Manchester City",
    "birthYear": 1996, "height": "6'2\"", "weight": "176 lbs", "isActive": true, "rating": 34,
    "biography": "Rodri won the 2024 Ballon d'Or after an extraordinary year winning the Euros with Spain and the Premier League with Manchester City, cementing himself as the world's best defensive midfielder.",
    "careerHighlights": ["2024 Ballon d'Or winner", "2024 UEFA European Championship winner with Spain", "4x Premier League champion", "2023 UEFA Champions League winner (Treble season)", "UEFA Nations League winner with Spain"],
    "strengths": ["Ball winning", "Positional intelligence", "Passing under pressure"],
    "legacySummary": "The 2024 Ballon d'Or winner — a defensive midfielder so complete he won football's highest individual honour."
  },
  {
    "rank": 67, "name": "Pedri", "displayName": "Pedri",
    "nationality": "Spain", "position": "Midfielder", "team": "Barcelona",
    "birthYear": 2002, "height": "5'9\"", "weight": "154 lbs", "isActive": true, "rating": 33,
    "biography": "Pedri is Barcelona's most exciting young talent since Messi, winning the Golden Boy award and the European Championship with Spain while displaying composure and creativity beyond his years.",
    "careerHighlights": ["2024 UEFA European Championship winner", "2021 UEFA Euro Young Player of the Tournament", "2021 Golden Boy winner", "Copa del Rey winner with Barcelona", "Kopa Trophy winner"],
    "strengths": ["Dribbling in small spaces", "Ball retention", "Vision"],
    "legacySummary": "The new heartbeat of Barcelona and Spain — a generational talent who plays at 22 like a veteran of 30."
  },
  {
    "rank": 68, "name": "Bukayo Saka", "displayName": "Saka",
    "nationality": "England", "position": "Forward", "team": "Arsenal",
    "birthYear": 2001, "height": "5'10\"", "weight": "163 lbs", "isActive": true, "rating": 32,
    "biography": "Bukayo Saka has emerged as Arsenal's most important player and England's most consistent performer, winning the PFA Young Player of the Year twice and becoming one of the Premier League's most complete attackers.",
    "careerHighlights": ["2x PFA Young Player of the Year", "Euro 2020 finalist with England", "Arsenal Player of the Season (x2)", "Most Premier League assists in 2022-23", "Consistent England starter since age 18"],
    "strengths": ["Versatility (right wing or right back)", "Dribbling and creativity", "Clutch performances"],
    "legacySummary": "Arsenal's beating heart and England's brightest young star — composed, creative and relentlessly consistent."
  },
  {
    "rank": 69, "name": "Virgil van Dijk", "displayName": "Van Dijk",
    "nationality": "Netherlands", "position": "Defender", "team": "Liverpool",
    "birthYear": 1991, "height": "6'4\"", "weight": "197 lbs", "isActive": true, "rating": 31,
    "biography": "Virgil van Dijk transformed Liverpool from title challengers to champions with his commanding presence, finishing second in the Ballon d'Or in 2019 — the highest ever finish by a defender.",
    "careerHighlights": ["2019 UEFA Champions League winner with Liverpool", "Premier League champion 2020", "2019 Ballon d'Or runner-up (highest ever for a defender)", "PFA Players' Player of the Year 2019", "UEFA Men's Player of the Year 2019"],
    "strengths": ["Aerial dominance", "Composure in possession", "Leadership"],
    "legacySummary": "The greatest modern defender — Van Dijk made Liverpool a fortress and finished 2nd in the Ballon d'Or."
  },
  {
    "rank": 70, "name": "Gavi", "displayName": "Gavi",
    "nationality": "Spain", "position": "Midfielder", "team": "Barcelona",
    "birthYear": 2004, "height": "5'7\"", "weight": "148 lbs", "isActive": true, "rating": 30,
    "biography": "Gavi won the Ballon d'Or's Kopa Trophy at 17 and became Spain's youngest ever international, embodying the Barcelona midfield tradition of Xavi and Iniesta with his energy and technique.",
    "careerHighlights": ["2021 Kopa Trophy winner", "2024 UEFA European Championship winner with Spain", "Copa del Rey winner with Barcelona", "Spain's youngest ever international", "La Liga champion with Barcelona"],
    "strengths": ["Pressing intensity", "Ball retention", "Short passing in tight spaces"],
    "legacySummary": "Barcelona's 21st-century Xavi — small, fierce, and utterly dominant in the middle of the park."
  },
  {
    "rank": 71, "name": "Harry Kane", "displayName": "Kane",
    "nationality": "England", "position": "Forward", "team": "Bayern Munich",
    "birthYear": 1993, "height": "6'2\"", "weight": "183 lbs", "isActive": true, "rating": 29,
    "biography": "Harry Kane is England's all-time top scorer and one of the most complete centre forwards in world football, combining powerful finishing with exceptional link-up play and hold-up ability.",
    "careerHighlights": ["England all-time top scorer (63 goals)", "2018 World Cup Golden Boot (6 goals)", "2x Premier League Golden Boot", "Tottenham all-time top scorer (280 goals)", "Bundesliga top scorer 2023-24 debut season"],
    "strengths": ["Powerful finishing", "Hold-up play", "Aerial ability"],
    "legacySummary": "England's greatest goalscorer — a striker who would walk into any team in the world."
  },
  {
    "rank": 72, "name": "Phil Foden", "displayName": "Foden",
    "nationality": "England", "position": "Midfielder", "team": "Manchester City",
    "birthYear": 2000, "height": "5'7\"", "weight": "154 lbs", "isActive": true, "rating": 28,
    "biography": "Phil Foden won PFA Player of the Year in 2023-24 after an exceptional season with Manchester City and has won more Premier League medals than any English player in history.",
    "careerHighlights": ["6x Premier League champion", "2023 UEFA Champions League winner", "PFA Player of the Year 2023-24", "Youngest scorer in Champions League knockout stage", "Euro 2024 finalist with England"],
    "strengths": ["Close control", "Intelligence in tight spaces", "Goals and assists"],
    "legacySummary": "Manchester City's homegrown gem — the most medal-laden Englishman in Premier League history."
  },
  {
    "rank": 73, "name": "Bruno Fernandes", "displayName": "Bruno Fernandes",
    "nationality": "Portugal", "position": "Midfielder", "team": "Manchester United",
    "birthYear": 1994, "height": "6'0\"", "weight": "169 lbs", "isActive": true, "rating": 27,
    "biography": "Bruno Fernandes transformed Manchester United's form after joining in January 2020, winning multiple Player of the Year awards while consistently producing double-digit goals and assists each season.",
    "careerHighlights": ["Man United Player of the Year (x3)", "2x PFA Team of the Year", "FA Cup finalist", "Serie A champion with Sporting CP", "Portugal's captain and key player"],
    "strengths": ["Long-range shooting", "Creativity and through balls", "Free kicks"],
    "legacySummary": "Manchester United's creative heartbeat — the Portuguese magician who transformed a struggling giant."
  },
  {
    "rank": 74, "name": "Marcus Rashford", "displayName": "Rashford",
    "nationality": "England", "position": "Forward", "team": "Manchester United",
    "birthYear": 1997, "height": "5'11\"", "weight": "163 lbs", "isActive": true, "rating": 26,
    "biography": "Marcus Rashford rose from Manchester United's academy to become England's most versatile forward, excelling on the left wing with his pace and directness while scoring crucial goals in major tournaments.",
    "careerHighlights": ["2023 League Cup winner with Man United", "Euro 2020 finalist with England", "Man United academy product and all-time young scorer", "20+ league goals in 2022-23 season", "Europa League winner 2017"],
    "strengths": ["Pace in behind", "Dribbling", "Direct running"],
    "legacySummary": "From academy kid to global icon — Rashford's story on and off the pitch defines a generation."
  },
  {
    "rank": 75, "name": "Lautaro Martinez", "displayName": "Lautaro Martínez",
    "nationality": "Argentina", "position": "Forward", "team": "Inter Milan",
    "birthYear": 1997, "height": "5'9\"", "weight": "172 lbs", "isActive": true, "rating": 25,
    "biography": "Lautaro Martínez was a key part of Argentina's historic World Cup triumph in 2022 and won the Serie A title with Inter Milan, establishing himself as one of Europe's most dangerous strikers.",
    "careerHighlights": ["2022 FIFA World Cup winner with Argentina", "2023 Serie A champion with Inter Milan", "2021 Copa América winner with Argentina", "UEFA Champions League finalist 2023", "Serie A Golden Boot contender"],
    "strengths": ["Pressing from the front", "Link-up play", "Goals in big games"],
    "legacySummary": "Argentina's next great striker — a World Cup winner who combines determination with elite finishing."
  },
  {
    "rank": 76, "name": "Federico Valverde", "displayName": "Valverde",
    "nationality": "Uruguay", "position": "Midfielder", "team": "Real Madrid",
    "birthYear": 1998, "height": "6'0\"", "weight": "165 lbs", "isActive": true, "rating": 24,
    "biography": "Federico Valverde has become one of Real Madrid's most important players, combining relentless energy with technical quality and contributing crucial goals in Champions League knockout matches.",
    "careerHighlights": ["2x UEFA Champions League winner with Real Madrid", "2x La Liga champion", "Champions League final goal-line clearance 2022", "Copa América finalist with Uruguay", "UEFA Team of the Tournament"],
    "strengths": ["Box-to-box running", "Driving forward with the ball", "Goals from deep"],
    "legacySummary": "Real Madrid's diesel engine — the Uruguayan who never stops running and always delivers in the biggest moments."
  },
  {
    "rank": 77, "name": "Jamal Musiala", "displayName": "Musiala",
    "nationality": "Germany", "position": "Midfielder", "team": "Bayern Munich",
    "birthYear": 2003, "height": "6'0\"", "weight": "163 lbs", "isActive": true, "rating": 23,
    "biography": "Jamal Musiala is Bayern Munich's brightest talent and Germany's most creative player, combining exceptional dribbling with an eye for goal at an age when most players are still developing.",
    "careerHighlights": ["Multiple Bundesliga champion with Bayern Munich", "2024 European Championship finalist with Germany (Young Player of Tournament)", "Bundesliga's youngest double-figure scorer", "Champions League regular at 19", "FIFA Best Young Player nominee"],
    "strengths": ["Dribbling past opponents", "Creativity in small spaces", "Goals and assists"],
    "legacySummary": "Germany's wonderkid — the heir to their great midfield tradition who plays with the freedom of a street footballer."
  },
  {
    "rank": 78, "name": "Antoine Griezmann", "displayName": "Griezmann",
    "nationality": "France", "position": "Forward", "team": "Atletico Madrid",
    "birthYear": 1991, "height": "5'10\"", "weight": "159 lbs", "isActive": true, "rating": 22,
    "biography": "Antoine Griezmann won the World Cup with France in 2018 and has been the defining player for Atlético Madrid for a decade, combining intelligent movement with consistent goals in big matches.",
    "careerHighlights": ["2018 FIFA World Cup winner", "2016 UEFA European Championship finalist", "2x La Liga champion", "Europa League winner 2018 with Atlético", "2016 UEFA Euro Golden Boot"],
    "strengths": ["Movement off the ball", "Finishing in tight spaces", "Work rate defensively"],
    "legacySummary": "Le Petit Diable — France's World Cup winner and Atlético's ultimate big-game performer."
  },
  {
    "rank": 79, "name": "Paulo Dybala", "displayName": "Dybala",
    "nationality": "Argentina", "position": "Forward", "team": "AS Roma",
    "birthYear": 1993, "height": "5'9\"", "weight": "163 lbs", "isActive": true, "rating": 21,
    "biography": "Paulo Dybala is one of the most technically gifted players of his generation, winning multiple Serie A titles with Juventus and becoming a beloved figure at AS Roma with his creativity and goals.",
    "careerHighlights": ["2022 FIFA World Cup winner with Argentina", "5x Serie A champion with Juventus", "Copa del Rey finalist", "Europa League winner with Roma 2023", "Juventus all-time top scorer in Serie A"],
    "strengths": ["Dribbling and close control", "Creative passing", "Long-range shooting"],
    "legacySummary": "La Joya — Argentina's jewel and one of the most naturally gifted players of the modern era."
  },
  {
    "rank": 80, "name": "Son Heung-min", "displayName": "Son",
    "nationality": "South Korea", "position": "Forward", "team": "Tottenham",
    "birthYear": 1992, "height": "6'0\"", "weight": "172 lbs", "isActive": true, "rating": 20,
    "biography": "Son Heung-min is Asia's greatest ever footballer, sharing the Premier League Golden Boot in 2022 and consistently ranking among the league's best players while inspiring a generation across South Korea.",
    "careerHighlights": ["Premier League Golden Boot 2021-22 (joint, 23 goals)", "Champions League finalist 2019", "Olympic gold medal 2018 with South Korea", "South Korea all-time top scorer", "4x PFA Team of the Year"],
    "strengths": ["Pace going forward", "Goals with both feet", "Work rate and pressing"],
    "legacySummary": "Asia's greatest footballer — the smiling assassin who proved Korean football belongs at the very top."
  },
  {
    "rank": 81, "name": "Romelu Lukaku", "displayName": "Lukaku",
    "nationality": "Belgium", "position": "Forward", "team": "Inter Milan",
    "birthYear": 1993, "height": "6'3\"", "weight": "212 lbs", "isActive": true, "rating": 19,
    "biography": "Romelu Lukaku is Belgium's all-time top scorer and one of the most physically imposing strikers in Europe, winning Serie A with Inter Milan and regularly threatening defenders across major leagues.",
    "careerHighlights": ["2021 Serie A champion with Inter Milan", "Belgium all-time top scorer (74 goals)", "Premier League winner with Chelsea (2015)", "Serie A top scorer", "2019-20 Serie A Player of the Season"],
    "strengths": ["Physical strength", "Hold-up play", "Pace for his size"],
    "legacySummary": "Belgium's record scorer and the Prem's most physically dominant striker — unstoppable when on song."
  },
  {
    "rank": 82, "name": "Ousmane Dembele", "displayName": "Dembélé",
    "nationality": "France", "position": "Forward", "team": "Barcelona",
    "birthYear": 1997, "height": "5'10\"", "weight": "150 lbs", "isActive": true, "rating": 18,
    "biography": "Ousmane Dembélé has finally fulfilled his huge potential at Barcelona, becoming La Liga's top assister and winning the Champions League with Paris Saint-Germain.",
    "careerHighlights": ["2024 UEFA Champions League winner with PSG", "La Liga champion with Barcelona", "2018 World Cup winner with France", "2x La Liga assists champion", "Champions League finalist with PSG"],
    "strengths": ["Explosive pace", "Dribbling both directions", "Crossing and assists"],
    "legacySummary": "French football's most unpredictable wide player — injury-prone but absolutely electric when fit."
  },
  {
    "rank": 83, "name": "Rafael Leao", "displayName": "Leão",
    "nationality": "Portugal", "position": "Forward", "team": "AC Milan",
    "birthYear": 1999, "height": "6'1\"", "weight": "172 lbs", "isActive": true, "rating": 17,
    "biography": "Rafael Leão is one of the most exciting wingers in European football, winning Serie A with AC Milan and consistently ranking among the most dangerous left-sided attackers in Italy.",
    "careerHighlights": ["2022 Serie A champion with AC Milan", "2022 Serie A Player of the Season", "Portugal international and regular starter", "Champions League quarterfinalist", "Serie A top dribbler (multiple seasons)"],
    "strengths": ["Explosive acceleration", "Dribbling at pace", "Physical presence on the wing"],
    "legacySummary": "Milan's electric left winger — raw pace and power that few defenders in Europe can contain."
  },
  {
    "rank": 84, "name": "Eduardo Camavinga", "displayName": "Camavinga",
    "nationality": "France", "position": "Midfielder", "team": "Real Madrid",
    "birthYear": 2002, "height": "6'0\"", "weight": "170 lbs", "isActive": true, "rating": 16,
    "biography": "Eduardo Camavinga is one of Real Madrid's most important squad players, winning multiple Champions League and La Liga titles while contributing crucial goals and interventions in knockout football.",
    "careerHighlights": ["2x UEFA Champions League winner with Real Madrid", "2x La Liga champion", "Scored Champions League semifinal goal", "France international from age 17", "Rennes to Real Madrid at 18"],
    "strengths": ["Ball carrying from midfield", "Athleticism", "Versatility (CM or LB)"],
    "legacySummary": "Real Madrid's future — a Champions League winner at 19 who is only scratching the surface of his talent."
  },
  {
    "rank": 85, "name": "Florian Wirtz", "displayName": "Wirtz",
    "nationality": "Germany", "position": "Midfielder", "team": "Bayer Leverkusen",
    "birthYear": 2003, "height": "5'10\"", "weight": "163 lbs", "isActive": true, "rating": 15,
    "biography": "Florian Wirtz led Bayer Leverkusen to their first-ever Bundesliga title in 2023-24 with an unbeaten season, confirming himself as Germany's most gifted young player and a future Ballon d'Or contender.",
    "careerHighlights": ["2023-24 Bundesliga champion with Leverkusen (unbeaten season)", "2023-24 Europa League finalist", "2024 European Championship finalist with Germany", "Youngest Bundesliga goal scorer at Leverkusen", "Golden Boy shortlist"],
    "strengths": ["Technical brilliance", "Goals and assists from midfield", "Vision"],
    "legacySummary": "Germany's next superstar — the architect of Leverkusen's historic unbeaten title and the future of European football."
  },
  {
    "rank": 86, "name": "Marcelo", "displayName": "Marcelo",
    "nationality": "Brazil", "position": "Left Back", "team": "Real Madrid",
    "birthYear": 1988, "height": "5'9\"", "weight": "174 lbs", "isActive": false, "rating": 14,
    "biography": "Marcelo spent 15 years at Real Madrid and is widely considered the best left back of his generation, winning four Champions League titles and multiple La Liga crowns with his trademark attacking style.",
    "careerHighlights": ["4x UEFA Champions League winner", "6x La Liga champion", "Copa América finalist with Brazil", "Real Madrid all-time left back (most appearances)", "UEFA Team of the Year 5 times"],
    "strengths": ["Attacking runs from left back", "Technical quality", "Crossing"],
    "legacySummary": "Real Madrid's most decorated left back — a loyal servant who won everything the club could offer."
  },
  {
    "rank": 87, "name": "Oliver Kahn", "displayName": "Kahn",
    "nationality": "Germany", "position": "Goalkeeper", "team": "Bayern Munich",
    "birthYear": 1969, "height": "6'3\"", "weight": "196 lbs", "isActive": false, "rating": 13,
    "biography": "Oliver Kahn is the only goalkeeper to win the Golden Ball at a World Cup (2002), and was Germany's most dominant keeper of his era, winning the Bundesliga eight times with Bayern Munich.",
    "careerHighlights": ["2002 World Cup Golden Ball (only goalkeeper ever)", "8x Bundesliga champion with Bayern Munich", "2001 UEFA Champions League winner", "3x German Goalkeeper of the Year", "UEFA Best Goalkeeper multiple times"],
    "strengths": ["Aggressive shot stopping", "Leadership and vocal presence", "Penalty saving"],
    "legacySummary": "Titan — the most ferocious and competitive goalkeeper who ever played for the German national team."
  },
  {
    "rank": 88, "name": "Peter Schmeichel", "displayName": "Schmeichel",
    "nationality": "Denmark", "position": "Goalkeeper", "team": "Manchester United",
    "birthYear": 1963, "height": "6'4\"", "weight": "214 lbs", "isActive": false, "rating": 12,
    "biography": "Peter Schmeichel is the greatest Premier League goalkeeper in history, helping Manchester United win the 1999 Treble and captaining Denmark to a shock Euro 1992 triumph.",
    "careerHighlights": ["1999 Treble winner with Manchester United", "1992 UEFA European Championship winner with Denmark", "5x Premier League champion", "UEFA Champions League winner 1999", "Danish Footballer of the Year (x7)"],
    "strengths": ["Star-fish saves", "One-on-one stopping", "Commanding his area"],
    "legacySummary": "The Great Dane — possibly the best goalkeeper in Premier League history and a Treble winner."
  },
  {
    "rank": 89, "name": "Rui Costa", "displayName": "Rui Costa",
    "nationality": "Portugal", "position": "Midfielder", "team": "AC Milan",
    "birthYear": 1972, "height": "6'1\"", "weight": "179 lbs", "isActive": false, "rating": 11,
    "biography": "Rui Costa was one of the finest creative midfielders of the late 1990s and early 2000s, thrilling fans at Fiorentina and AC Milan with his vision, technique and eye for the spectacular.",
    "careerHighlights": ["2x UEFA Champions League finalist with AC Milan", "Serie A champion with AC Milan", "Portuguese Liga champion with Benfica (x5)", "UEFA U21 Championship winner with Portugal", "Euro 2004 finalist with Portugal"],
    "strengths": ["Through ball delivery", "Long-range shooting", "Technical flair"],
    "legacySummary": "One of Portugal's greatest export — an elegant creative midfielder who lit up Serie A at its height."
  },
  {
    "rank": 90, "name": "Mesut Ozil", "displayName": "Özil",
    "nationality": "Germany", "position": "Midfielder", "team": "Arsenal",
    "birthYear": 1988, "height": "5'11\"", "weight": "163 lbs", "isActive": false, "rating": 10,
    "biography": "Mesut Özil won the 2014 World Cup with Germany and set the Premier League record for assists in a season with Arsenal, making him one of the finest creative midfielders of his generation.",
    "careerHighlights": ["2014 FIFA World Cup winner", "La Liga champion with Real Madrid", "Premier League assists record (19 in a season)", "FA Cup winner with Arsenal (x3)", "UEFA Team of the Year multiple times"],
    "strengths": ["Vision and creativity", "Through ball delivery", "Technical touch"],
    "legacySummary": "Football's most elegant artist — a World Cup winner whose assist record at Arsenal may never be beaten."
  },
  {
    "rank": 91, "name": "David Villa", "displayName": "Villa",
    "nationality": "Spain", "position": "Forward", "team": "Valencia",
    "birthYear": 1981, "height": "5'9\"", "weight": "163 lbs", "isActive": false, "rating": 9,
    "biography": "David Villa is Spain's all-time top scorer and the Golden Boot winner at the 2010 World Cup, a clinical striker who helped Spain dominate international football for six years.",
    "careerHighlights": ["2010 FIFA World Cup winner and top scorer", "2x UEFA European Championship winner", "La Liga champion with Barcelona", "UEFA Champions League winner 2009 with Barcelona", "Spain all-time top scorer (59 goals)"],
    "strengths": ["Clinical finishing with either foot", "Pace", "Movement"],
    "legacySummary": "Spain's greatest ever striker — the World Cup's golden boot and the final piece in football's greatest international team."
  },
  {
    "rank": 92, "name": "Fernando Hierro", "displayName": "Hierro",
    "nationality": "Spain", "position": "Defender", "team": "Real Madrid",
    "birthYear": 1968, "height": "6'2\"", "weight": "187 lbs", "isActive": false, "rating": 8,
    "biography": "Fernando Hierro was Real Madrid's defensive leader and set-piece specialist for over a decade, winning three Champions Leagues and five La Liga titles before retiring as Spain's all-time record scorer from defence.",
    "careerHighlights": ["3x UEFA Champions League winner", "5x La Liga champion", "Real Madrid captain for 10 years", "Spain's top-scoring defender (29 international goals)", "Named in Real Madrid's all-time greatest XI"],
    "strengths": ["Leadership", "Set piece goals from defence", "Commanding presence"],
    "legacySummary": "Real Madrid's defensive cornerstone — a Champions League colossus who scored more than most strikers."
  },
  {
    "rank": 93, "name": "Carles Puyol", "displayName": "Puyol",
    "nationality": "Spain", "position": "Defender", "team": "Barcelona",
    "birthYear": 1978, "height": "5'11\"", "weight": "176 lbs", "isActive": false, "rating": 7,
    "biography": "Carles Puyol was Barcelona's warrior captain who symbolised the club's grit and competitive edge, winning 6 La Liga titles, 3 Champions Leagues, and the World Cup with Spain.",
    "careerHighlights": ["3x UEFA Champions League winner", "6x La Liga champion with Barcelona", "2010 FIFA World Cup winner", "2x UEFA European Championship winner", "Scored the semifinal header to send Spain to 2010 World Cup Final"],
    "strengths": ["Aerial defending", "Commitment and intensity", "Leadership"],
    "legacySummary": "The heart and soul of Barcelona's golden era — a warrior who bled for the badge every single game."
  },
  {
    "rank": 94, "name": "Dimitar Berbatov", "displayName": "Berbatov",
    "nationality": "Bulgaria", "position": "Forward", "team": "Manchester United",
    "birthYear": 1981, "height": "6'2\"", "weight": "183 lbs", "isActive": false, "rating": 6,
    "biography": "Dimitar Berbatov was one of the most elegant and technically gifted strikers to play in the Premier League, winning the league with Manchester United and sharing the Golden Boot with Tevez in 2010-11.",
    "careerHighlights": ["2x Premier League champion with Manchester United", "Premier League Golden Boot 2010-11 (joint, 20 goals)", "2x Bundesliga champion with Bayer Leverkusen", "FA Cup winner 2004 with Spurs", "Bulgarian Footballer of the Year multiple times"],
    "strengths": ["First touch", "Aerial control", "Hold-up play"],
    "legacySummary": "Football's most languid genius — Berbatov made the sport look effortless and ungainly defenders look foolish."
  },
  {
    "rank": 95, "name": "Hernán Crespo", "displayName": "Crespo",
    "nationality": "Argentina", "position": "Forward", "team": "AC Milan",
    "birthYear": 1975, "height": "6'1\"", "weight": "181 lbs", "isActive": false, "rating": 5,
    "biography": "Hernán Crespo was one of the most lethal strikers of the early 2000s, scoring two goals in the 2005 Champions League Final for AC Milan and winning league titles across Serie A.",
    "careerHighlights": ["2x UEFA Champions League finalist", "Serie A champion with Internazionale", "Argentina top scorer in multiple World Cup campaigns", "Record transfer to Lazio at the time (35m euros)", "Champions League Final scorer 2005"],
    "strengths": ["Movement in the box", "Clinical finishing", "Aerial ability"],
    "legacySummary": "The Argentine assassin who terrorised defences across Europe — the man who scored twice in a Champions League Final."
  },
  {
    "rank": 96, "name": "Filippo Inzaghi", "displayName": "Inzaghi",
    "nationality": "Italy", "position": "Forward", "team": "AC Milan",
    "birthYear": 1973, "height": "5'11\"", "weight": "163 lbs", "isActive": false, "rating": 4,
    "biography": "Filippo Inzaghi scored in two Champions League Finals and was the ultimate poacher, consistently found in the right place at the right time to score crucial goals throughout his career at AC Milan.",
    "careerHighlights": ["2x UEFA Champions League winner (scored in 2003 and 2007 Finals)", "2006 FIFA World Cup winner with Italy", "3x Serie A champion", "7x Italian Super Cup winner", "AC Milan all-time top scorer in European competition"],
    "strengths": ["Penalty area positioning", "Predatory instinct", "Off-side timing"],
    "legacySummary": "Football's ultimate goal-poacher — accused of cheating by Zidane, celebrated by Milan fans forever."
  },
  {
    "rank": 97, "name": "Oliver Giroud", "displayName": "Giroud",
    "nationality": "France", "position": "Forward", "team": "AC Milan",
    "birthYear": 1986, "height": "6'3\"", "weight": "205 lbs", "isActive": false, "rating": 3,
    "biography": "Olivier Giroud is France's all-time top scorer and a serial trophy winner, winning the World Cup in 2018, the Premier League with Chelsea, and the Champions League with AC Milan.",
    "careerHighlights": ["2018 FIFA World Cup winner", "Serie A champion with AC Milan (2022)", "2x FA Cup winner with Arsenal", "2022 Champions League winner with Milan", "France all-time top scorer (57 goals)"],
    "strengths": ["Hold-up play and link-up", "Aerial ability", "Big match goals"],
    "legacySummary": "France's unsung hero and serial trophy winner — the perfect team player who always delivered when it mattered."
  },
  {
    "rank": 98, "name": "Deco", "displayName": "Deco",
    "nationality": "Portugal", "position": "Midfielder", "team": "Barcelona",
    "birthYear": 1977, "height": "5'9\"", "weight": "163 lbs", "isActive": false, "rating": 2,
    "biography": "Deco won the Champions League with Porto under José Mourinho and again with Barcelona, bridging two golden eras of European football as one of the most technically complete midfielders of the 2000s.",
    "careerHighlights": ["2004 UEFA Champions League winner with Porto", "2006 UEFA Champions League winner with Barcelona", "2x La Liga champion", "2004 Champions League Player of the Tournament", "Euro 2004 finalist with Portugal"],
    "strengths": ["Short passing", "Dribbling in tight spaces", "Reading the game"],
    "legacySummary": "The bridge between Porto's miracle and Barcelona's golden era — Deco made great teams even greater."
  },
  {
    "rank": 99, "name": "Andrey Arshavin", "displayName": "Arshavin",
    "nationality": "Russia", "position": "Forward", "team": "Arsenal",
    "birthYear": 1981, "height": "5'7\"", "weight": "154 lbs", "isActive": false, "rating": 1,
    "biography": "Andrei Arshavin was Russia's finest ever footballer, scoring four goals against Liverpool in a single Premier League game and shining at Euro 2008 before a memorable but inconsistent Arsenal career.",
    "careerHighlights": ["2008 UEFA European Championship third place with Russia", "Scored 4 goals at Anfield in one PL game", "Russian Premier League champion (x6) with Zenit", "UEFA Cup winner 2008 with Zenit", "Russian Footballer of the Year multiple times"],
    "strengths": ["Technical quality", "Dribbling", "Eye for goal"],
    "legacySummary": "Russia's greatest son — four goals at Anfield made him a Premier League legend for one extraordinary night."
  },
  {
    "rank": 100, "name": "Ronaldo Koeman", "displayName": "Koeman",
    "nationality": "Netherlands", "position": "Defender", "team": "Barcelona",
    "birthYear": 1963, "height": "6'1\"", "weight": "185 lbs", "isActive": false, "rating": 1,
    "biography": "Ronald Koeman scored the winning goal in the 1992 European Cup Final for Barcelona and was one of the finest ball-playing defenders of his era, with a legendary free kick in the Nou Camp.",
    "careerHighlights": ["1992 European Cup winner with Barcelona (scored the Final goal)", "1988 UEFA European Championship winner with Netherlands", "4x La Liga champion with Barcelona", "Eredivisie champion multiple times", "Named in Barcelona's greatest ever XI"],
    "strengths": ["Long-range free kicks", "Passing from defence", "Leadership"],
    "legacySummary": "The goal that won Barcelona their first European Cup — Koeman's free kick echoes through Nou Camp history."
  }
]
```

**Step 2: Verify the file was created**

```bash
wc -l services/player-service/src/main/resources/data/football-top-100.json
```

Expected: > 100 lines (the file has ~350+ lines)

**Step 3: Verify it's valid JSON**

```bash
python -m json.tool services/player-service/src/main/resources/data/football-top-100.json > /dev/null && echo "Valid JSON"
```

Expected: `Valid JSON`

**Step 4: Commit**

```bash
git add services/player-service/src/main/resources/data/football-top-100.json
git commit -m "data: add football-top-100.json with all 100 all-time greatest players"
```

---

## Task 2: Add `seedFromJsonFile` method to `Top100SeedingService`

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/Top100SeedingService.java`

**Step 1: Add the import and method**

Open `Top100SeedingService.java`. Add these imports at the top (after existing imports):

```java
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.core.io.ClassPathResource;
import java.io.InputStream;
```

Then add this method after the existing `seedTop100ForSport` method (around line 110):

```java
/**
 * Seed players from a pre-curated JSON file in src/main/resources/data/.
 * Much faster and more reliable than AI generation — no rate limits, no parsing failures.
 * Existing players are skipped via canonical_id check (idempotent).
 *
 * @return number of players newly inserted (skips existing)
 */
public int seedFromJsonFile(Sport sport) {
    String filename = "data/" + sport.name().toLowerCase() + "-top-100.json";
    log.info("📂 Loading players from classpath resource: {}", filename);

    List<Top100PlayerInfo> players;
    try {
        ClassPathResource resource = new ClassPathResource(filename);
        if (!resource.exists()) {
            log.error("❌ Resource not found: {}", filename);
            return 0;
        }
        try (InputStream is = resource.getInputStream()) {
            players = objectMapper.readValue(is, new TypeReference<List<Top100PlayerInfo>>() {});
        }
    } catch (Exception e) {
        log.error("❌ Failed to read JSON file {}: {}", filename, e.getMessage());
        return 0;
    }

    log.info("✅ Loaded {} players from JSON for {}", players.size(), sport);

    int seeded = 0;
    for (Top100PlayerInfo playerInfo : players) {
        // Skip placeholder/empty entries (rank duplicates used as placeholders)
        if (playerInfo.getCareerHighlights() != null && playerInfo.getCareerHighlights().isEmpty()
                && playerInfo.getStrengths() != null && playerInfo.getStrengths().isEmpty()) {
            log.debug("⏭️  Skipping placeholder entry for rank {}: {}", playerInfo.getRank(), playerInfo.getName());
            continue;
        }

        try {
            String displayName = playerInfo.getDisplayName() != null
                    ? playerInfo.getDisplayName() : playerInfo.getName();
            // Resolve photo from Wikipedia (fast, no AI rate limits)
            String photoUrl = imageEnrichmentService.findPhotoUrl(
                    displayName, playerInfo.getName(), sport.name().toLowerCase());

            savePlayer(playerInfo, sport, photoUrl);
            seeded++;
            log.info("✅ Seeded #{}: {} [photo: {}]",
                    playerInfo.getRank(), playerInfo.getName(), photoUrl != null ? "✓" : "✗");
        } catch (Exception e) {
            log.warn("⚠️  Failed to seed {}: {}", playerInfo.getName(), e.getMessage());
        }
    }

    log.info("🎉 JSON seeding complete for {}. Newly seeded: {}", sport, seeded);
    return seeded;
}
```

**Step 2: Compile**

```bash
cd services/player-service
mvn compile -q
```

Expected: `BUILD SUCCESS`

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/service/Top100SeedingService.java
git commit -m "feat: add seedFromJsonFile() to Top100SeedingService for reliable JSON-based seeding"
```

---

## Task 3: Add admin endpoint for JSON seeding

**Files:**
- Modify: `services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AdminController.java`

**Step 1: Add the new endpoint**

Open `AdminController.java`. Add this method after the existing `seedTop100` method (around line 442):

```java
@PostMapping("/top100/seed-from-json/{sport}")
@Operation(summary = "Seed Top 100 from hardcoded JSON (reliable, no AI calls)",
           description = "Reads from src/main/resources/data/{sport}-top-100.json and seeds all players. Idempotent — existing players are skipped.")
public ResponseEntity<Map<String, Object>> seedTop100FromJson(@PathVariable String sport) {
    log.info("📂 Admin request to seed Top 100 from JSON for: {}", sport);

    try {
        Sport sportEnum = Sport.valueOf(sport.toUpperCase());

        // Run synchronously so we can return actual count (fast — no AI calls)
        int count = top100SeedingService.seedFromJsonFile(sportEnum);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "sport", sport.toUpperCase(),
            "newlySeeded", count,
            "message", count + " players newly seeded from JSON file",
            "checkEndpoint", "/api/admin/players/top100/stats",
            "viewEndpoint", "/api/admin/players/top100/" + sport.toLowerCase()
        ));

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "error", "Invalid sport. Valid values: FOOTBALL, BASKETBALL, MMA, CRICKET, TENNIS"
        ));
    } catch (Exception e) {
        log.error("Error seeding from JSON for {}: {}", sport, e.getMessage(), e);
        return ResponseEntity.internalServerError().body(Map.of(
            "success", false,
            "error", e.getMessage()
        ));
    }
}
```

**Step 2: Compile**

```bash
mvn compile -q
```

Expected: `BUILD SUCCESS`

**Step 3: Commit**

```bash
git add services/player-service/src/main/java/com/topplayersofallsports/playerservice/controller/AdminController.java
git commit -m "feat: add POST /api/admin/players/top100/seed-from-json/{sport} endpoint"
```

---

## Task 4: Start player-service and trigger seeding

**Step 1: Start the player-service**

```bash
cd services/player-service
mvn spring-boot:run
```

Wait for: `Started PlayerServiceApplication in X seconds`

**Step 2: Trigger JSON seeding for football**

```bash
curl -s -X POST http://localhost:8084/api/admin/players/top100/seed-from-json/football | python -m json.tool
```

Expected response:
```json
{
  "success": true,
  "sport": "FOOTBALL",
  "newlySeeded": 90,
  "message": "90 players newly seeded from JSON file"
}
```

(90 new = 100 total - 10 already existing)

**Step 3: Verify DB count**

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d topplayersofallsports \
  -c "SELECT COUNT(*), MIN(current_rank), MAX(current_rank) FROM players WHERE sport = 'FOOTBALL';"
```

Expected:
```
 count | min | max
-------+-----+-----
   100 |   1 | 100
```

**Step 4: Check for any duplicates**

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d topplayersofallsports -c "
SELECT name, COUNT(*) as cnt
FROM players
WHERE sport = 'FOOTBALL'
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY cnt DESC;"
```

Expected: `(0 rows)` — no duplicates.

**Step 5: Commit verification (no code change — just note in log)**

---

## Task 5: Verify the public API and UI

**Step 1: Call the public top100 API**

```bash
curl -s http://localhost:8084/api/players/top100/FOOTBALL | python -m json.tool | grep -E '"count"|"rank"' | head -10
```

Expected:
```json
"count": 100,
```

**Step 2: Verify ranks 1–100 are all present**

```bash
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d topplayersofallsports -c "
SELECT current_rank, name FROM players
WHERE sport = 'FOOTBALL'
ORDER BY current_rank ASC;" | head -30
```

**Step 3: Open the frontend**

Start the frontend if not running:
```bash
npm run dev
```

Navigate to `http://localhost:5173/players-directory`. Select **Football** tab.

Expected:
- Page 1 shows ranks 1–20 (Messi to Thierry Henry)
- Page 2 shows ranks 21–40
- Page 3 shows ranks 41–60
- Page 4 shows ranks 61–80
- Page 5 shows ranks 81–100
- Total count shown as 100

**Step 4: Final commit**

```bash
git add -u
git commit -m "feat: seed 100 football players from JSON — all ranks 1-100 complete"
```

---

## Final Verification Checklist

```
[ ] football-top-100.json exists in src/main/resources/data/
[ ] seedFromJsonFile() compiles and runs without errors
[ ] POST /api/admin/players/top100/seed-from-json/football returns success
[ ] DB has exactly 100 FOOTBALL players (SELECT COUNT(*) = 100)
[ ] No duplicate names in DB
[ ] Ranks 1-100 all present (no gaps)
[ ] GET /api/players/top100/FOOTBALL returns count: 100
[ ] Frontend players-directory shows 100 players across 5 pages
[ ] Photos loaded for the majority of players
```
