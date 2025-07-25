import openai from './openaiClient';

/**
 * AI-powered sports content generation service
 */
class AISportsService {
  /**
   * Generates AI-powered news articles with summaries
   * @param {string} topic - The sports topic to generate news about
   * @param {string} category - Sports category (NBA, NFL, MLB, etc.)
   * @returns {Promise<object>} Generated news article
   */
  async generateNewsArticle(topic, category) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are a professional sports journalist writing breaking news for TopPlayersofAllSports.com. Create engaging, factual-sounding sports news articles with realistic details.` 
          },
          { 
            role: 'user', 
            content: `Generate a breaking news article about ${topic} in ${category}. Include realistic player names, statistics, and game details.` 
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'news_article_response',
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                author: { type: 'string' },
                category: { type: 'string' },
                isBreaking: { type: 'boolean' },
                views: { type: 'string' },
                comments: { type: 'string' }
              },
              required: ['title', 'summary', 'author', 'category', 'isBreaking', 'views', 'comments'],
              additionalProperties: false,
            },
          },
        },
      });

      const article = JSON.parse(response.choices[0].message.content);
      return {
        ...article,
        id: Date.now() + Math.random(),
        type: 'news',
        image: this.getRandomSportsImage(category),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error generating news article:', error);
      throw error;
    }
  }

  /**
   * Generates AI-powered player profiles with stats and bio
   * @param {string} playerName - Name of the player
   * @param {string} sport - Sport category
   * @returns {Promise<object>} Generated player profile
   */
  async generatePlayerProfile(playerName, sport) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are a sports analyst creating detailed player profiles for TopPlayersofAllSports.com. Generate realistic player data with current season statistics.` 
          },
          { 
            role: 'user', 
            content: `Create a detailed profile for a ${sport} player named ${playerName}. Include position, team, stats, and recent performance updates.` 
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'player_profile_response',
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                position: { type: 'string' },
                team: { type: 'string' },
                stats: { 
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      value: { type: 'string' }
                    },
                    required: ['label', 'value']
                  }
                },
                trend: { type: 'string' },
                trendValue: { type: 'string' },
                performance: { type: 'number' },
                recentUpdate: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    timeAgo: { type: 'string' }
                  },
                  required: ['title', 'description', 'timeAgo']
                }
              },
              required: ['name', 'position', 'team', 'stats', 'trend', 'trendValue', 'performance', 'recentUpdate'],
              additionalProperties: false,
            },
          },
        },
      });

      const player = JSON.parse(response.choices[0].message.content);
      return {
        ...player,
        id: Date.now() + Math.random(),
        type: 'player',
        avatar: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 99)}.jpg`,
        teamColor: this.getTeamColor(player.team),
        isActive: true,
      };
    } catch (error) {
      console.error('Error generating player profile:', error);
      throw error;
    }
  }

  /**
   * Generates AI-powered video highlight descriptions
   * @param {string} sport - Sport category
   * @param {string} type - Type of highlight (touchdown, goal, dunk, etc.)
   * @returns {Promise<object>} Generated video highlight
   */
  async generateVideoHighlight(sport, type) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are a sports video content creator for TopPlayersofAllSports.com. Generate exciting highlight video descriptions with engaging titles.` 
          },
          { 
            role: 'user', 
            content: `Create a highlight video description for a ${type} in ${sport}. Make it exciting and include realistic view counts and engagement metrics.` 
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'video_highlight_response',
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                duration: { type: 'number' },
                views: { type: 'number' },
                likes: { type: 'string' },
                comments: { type: 'string' },
                quality: { type: 'string' },
                isHighlight: { type: 'boolean' }
              },
              required: ['title', 'description', 'category', 'duration', 'views', 'likes', 'comments', 'quality', 'isHighlight'],
              additionalProperties: false,
            },
          },
        },
      });

      const video = JSON.parse(response.choices[0].message.content);
      return {
        ...video,
        id: Date.now() + Math.random(),
        type: 'video',
        thumbnail: this.getRandomSportsImage(sport),
        uploadedAt: new Date(Date.now() - Math.random() * 86400000), // Random time within last 24 hours
      };
    } catch (error) {
      console.error('Error generating video highlight:', error);
      throw error;
    }
  }

  /**
   * Generates multiple AI-powered sports content items
   * @param {string} category - Sports category filter
   * @param {number} count - Number of items to generate
   * @returns {Promise<Array>} Array of generated content items
   */
  async generateMixedContent(category = 'all', count = 6) {
    try {
      const contentTypes = ['news', 'player', 'video'];
      const sportsCategories = category === 'all' 
        ? ['NBA', 'NFL', 'MLB', 'Soccer', 'NHL'] 
        : [category];
      
      const promises = [];
      
      for (let i = 0; i < count; i++) {
        const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        const sportCategory = sportsCategories[Math.floor(Math.random() * sportsCategories.length)];
        
        switch (contentType) {
          case 'news':
            promises.push(this.generateNewsArticle(
              this.getRandomTopic(sportCategory), 
              sportCategory
            ));
            break;
          case 'player':
            promises.push(this.generatePlayerProfile(
              this.getRandomPlayerName(), 
              sportCategory
            ));
            break;
          case 'video':
            promises.push(this.generateVideoHighlight(
              sportCategory, 
              this.getRandomHighlightType(sportCategory)
            ));
            break;
        }
      }
      
      const results = await Promise.allSettled(promises);
      return results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Error generating mixed content:', error);
      throw error;
    }
  }

  /**
   * Moderates content using OpenAI moderation API
   * @param {string} text - Text to moderate
   * @returns {Promise<object>} Moderation results
   */
  async moderateContent(text) {
    try {
      const response = await openai.moderations.create({
        model: 'text-moderation-latest',
        input: text,
      });

      return response.results[0];
    } catch (error) {
      console.error('Error moderating content:', error);
      throw error;
    }
  }

  // Helper methods
  getRandomSportsImage(category) {
    const imageMap = {
      'NBA': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=250&fit=crop',
      'NFL': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=250&fit=crop',
      'MLB': 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=250&fit=crop',
      'Soccer': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop',
      'NHL': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop',
    };
    return imageMap[category] || imageMap['NBA'];
  }

  getTeamColor(teamName) {
    const colors = [
      'bg-red-600', 'bg-blue-600', 'bg-green-600', 'bg-purple-600', 
      'bg-orange-600', 'bg-yellow-600', 'bg-indigo-600', 'bg-pink-600'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getRandomTopic(category) {
    const topics = {
      'NBA': ['playoff victory', 'record-breaking performance', 'trade announcement', 'injury update'],
      'NFL': ['touchdown record', 'draft news', 'playoff advancement', 'coaching change'],
      'MLB': ['world series', 'perfect game', 'home run record', 'spring training'],
      'Soccer': ['championship match', 'transfer news', 'world cup qualifier', 'derby victory'],
      'NHL': ['stanley cup', 'hat trick', 'goalie shutout', 'playoff overtime']
    };
    const categoryTopics = topics[category] || topics['NBA'];
    return categoryTopics[Math.floor(Math.random() * categoryTopics.length)];
  }

  getRandomPlayerName() {
    const names = [
      'Michael Johnson', 'Sarah Williams', 'David Rodriguez', 'Emma Thompson',
      'James Wilson', 'Olivia Davis', 'Robert Brown', 'Sophia Miller',
      'John Anderson', 'Isabella Garcia', 'William Martinez', 'Mia Taylor'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  getRandomHighlightType(category) {
    const types = {
      'NBA': ['dunk', 'three-pointer', 'steal', 'block'],
      'NFL': ['touchdown', 'interception', 'sack', 'field goal'],
      'MLB': ['home run', 'strikeout', 'double play', 'diving catch'],
      'Soccer': ['goal', 'assist', 'save', 'free kick'],
      'NHL': ['goal', 'save', 'hit', 'power play']
    };
    const categoryTypes = types[category] || types['NBA'];
    return categoryTypes[Math.floor(Math.random() * categoryTypes.length)];
  }
}

export default new AISportsService();