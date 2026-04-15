package com.topplayersofallsports.news.infrastructure.newsapi;

import com.fasterxml.jackson.databind.JsonNode;
import com.topplayersofallsports.news.domain.model.NewsArticle;
import com.topplayersofallsports.news.domain.model.Sport;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Client for NewsAPI.org using Spring WebClient
 * Production-ready implementation with proper error handling
 */
@Slf4j
@Component
public class NewsAPIClient {
    
    private WebClient webClient;
    
    @Value("${newsapi.api-key}")
    private String apiKey;
    
    @Value("${newsapi.base-url}")
    private String baseUrl;
    
    @Value("${newsapi.articles-per-sport}")
    private int articlesPerSport;
    
    @PostConstruct
    public void init() {
        this.webClient = WebClient.builder()
            .baseUrl(baseUrl)
            .build();
        log.info("NewsAPI WebClient initialized - base URL: {}, articles per sport: {}", 
            baseUrl, articlesPerSport);
    }
    
    /**
     * Sport-specific search queries for better results
     * Using more specific terms to avoid spam/irrelevant articles
     */
    private static final Map<Sport, String> SPORT_QUERIES = Map.of(
        Sport.BASKETBALL, "(NBA OR \"National Basketball Association\") AND (game OR player OR team OR score)",
        Sport.FOOTBALL, "(NFL OR \"National Football League\") AND (game OR player OR team OR touchdown)",
        Sport.SOCCER, "(\"Premier League\" OR \"Champions League\" OR FIFA OR UEFA) AND (match OR goal OR player)",
        Sport.HOCKEY, "(NHL OR \"National Hockey League\") AND (game OR player OR team OR goal)",
        Sport.TENNIS, "(ATP OR WTA OR \"Grand Slam\" OR Wimbledon OR \"US Open\") AND (match OR tournament OR player)",
        Sport.MMA, "(UFC OR \"Ultimate Fighting Championship\" OR Bellator) AND (fight OR fighter OR knockout)",
        Sport.BASEBALL, "(MLB OR \"Major League Baseball\") AND (game OR player OR team OR home run)",
        Sport.GOLF, "(PGA OR \"PGA Tour\" OR \"Masters Tournament\") AND (tournament OR player OR round)"
    );
    
    /**
     * Blacklisted sources that often return spam/irrelevant content
     */
    private static final List<String> BLACKLISTED_SOURCES = List.of(
        "BleepingComputer",
        "Hacker News",
        "Reddit",
        "4chan",
        "Pastebin",
        "[Removed]"
    );
    
    /**
     * Fetch top news articles for a specific sport
     */
    public List<NewsArticle> fetchTopArticles(Sport sport) {
        String query = SPORT_QUERIES.getOrDefault(sport, sport.name().toLowerCase());
        
        log.info("Fetching {} articles for sport: {} with query: {}", 
            articlesPerSport, sport, query);
        
        try {
            JsonNode response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/everything")
                    .queryParam("q", query)
                    .queryParam("language", "en")
                    .queryParam("sortBy", "publishedAt")
                    .queryParam("pageSize", articlesPerSport)
                    .queryParam("apiKey", apiKey)
                    .build())
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
            
            if (response == null) {
                log.error("Received null response from NewsAPI");
                return List.of();
            }
            
            String status = response.get("status").asText();
            if (!"ok".equals(status)) {
                log.error("NewsAPI returned error status: {}", status);
                if (response.has("message")) {
                    log.error("Error message: {}", response.get("message").asText());
                }
                return List.of();
            }
            
            List<NewsArticle> articles = parseArticles(response, sport);
            log.info("Successfully fetched {} articles for {}", articles.size(), sport);
            return articles;
            
        } catch (Exception e) {
            log.error("Error fetching news for sport {}: {}", sport, e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Parse NewsAPI JSON response into NewsArticle entities
     */
    private List<NewsArticle> parseArticles(JsonNode response, Sport sport) {
        List<NewsArticle> articles = new ArrayList<>();
        
        JsonNode articlesNode = response.get("articles");
        if (articlesNode == null || !articlesNode.isArray()) {
            return articles;
        }
        
        for (JsonNode articleNode : articlesNode) {
            try {
                String title = getTextValue(articleNode, "title");
                String url = getTextValue(articleNode, "url");
                String sourceName = getSourceName(articleNode);
                
                // Skip removed or invalid articles
                if (title == null || url == null || title.contains("[Removed]")) {
                    continue;
                }
                
                // Skip blacklisted sources (spam/malware sites)
                if (sourceName != null && BLACKLISTED_SOURCES.stream()
                    .anyMatch(blacklisted -> sourceName.toLowerCase().contains(blacklisted.toLowerCase()))) {
                    log.debug("Skipping blacklisted source: {}", sourceName);
                    continue;
                }
                
                // Skip articles with spam keywords in title
                String titleLower = title.toLowerCase();
                if (titleLower.contains("check emails") || 
                    titleLower.contains("malware") ||
                    titleLower.contains("virus") ||
                    titleLower.contains("trojan") ||
                    titleLower.contains("spyware")) {
                    log.debug("Skipping spam article: {}", title);
                    continue;
                }
                
                Instant publishedAt = parsePublishedAt(articleNode);
                
                NewsArticle article = NewsArticle.builder()
                    .title(cleanTitle(title))
                    .description(getTextValue(articleNode, "description"))
                    .content(cleanContent(getTextValue(articleNode, "content")))
                    .url(url)
                    .imageUrl(getTextValue(articleNode, "urlToImage"))
                    .author(getTextValue(articleNode, "author"))
                    .sourceName(getSourceName(articleNode))
                    .sport(sport)
                    .publishedAt(publishedAt)
                    .fetchedAt(Instant.now())
                    .isBreaking(isRecent(publishedAt))
                    .tags(extractTags(articleNode, sport))
                    .build();
                
                articles.add(article);
            } catch (Exception e) {
                log.warn("Error parsing article: {}", e.getMessage());
            }
        }
        
        return articles;
    }
    
    /**
     * Extract text value from JSON node
     */
    private String getTextValue(JsonNode node, String fieldName) {
        JsonNode field = node.get(fieldName);
        if (field != null && !field.isNull() && !field.asText().isEmpty()) {
            return field.asText();
        }
        return null;
    }
    
    /**
     * Get source name from article
     */
    private String getSourceName(JsonNode articleNode) {
        JsonNode source = articleNode.get("source");
        if (source != null) {
            JsonNode name = source.get("name");
            return (name != null && !name.isNull()) ? name.asText() : null;
        }
        return null;
    }
    
    /**
     * Parse published date
     */
    private Instant parsePublishedAt(JsonNode articleNode) {
        String publishedAt = getTextValue(articleNode, "publishedAt");
        if (publishedAt != null) {
            try {
                return ZonedDateTime.parse(publishedAt).toInstant();
            } catch (Exception e) {
                log.warn("Error parsing publishedAt: {}", publishedAt);
            }
        }
        return Instant.now();
    }
    
    /**
     * Check if article is recent (within last hour = breaking news)
     */
    private boolean isRecent(Instant publishedAt) {
        Instant oneHourAgo = Instant.now().minusSeconds(3600);
        return publishedAt.isAfter(oneHourAgo);
    }
    
    /**
     * Extract tags from article
     */
    private List<String> extractTags(JsonNode articleNode, Sport sport) {
        List<String> tags = new ArrayList<>();
        tags.add(sport.name());
        
        String title = getTextValue(articleNode, "title");
        String description = getTextValue(articleNode, "description");
        String combined = ((title != null ? title : "") + " " + 
                          (description != null ? description : "")).toLowerCase();
        
        // Extract player names
        addTagIfContains(tags, combined, "lebron", "LeBron James");
        addTagIfContains(tags, combined, "curry", "Stephen Curry");
        addTagIfContains(tags, combined, "brady", "Tom Brady");
        addTagIfContains(tags, combined, "mahomes", "Patrick Mahomes");
        addTagIfContains(tags, combined, "messi", "Lionel Messi");
        addTagIfContains(tags, combined, "ronaldo", "Cristiano Ronaldo");
        addTagIfContains(tags, combined, "mcdavid", "Connor McDavid");
        addTagIfContains(tags, combined, "djokovic", "Novak Djokovic");
        
        // Extract team names
        addTagIfContains(tags, combined, "lakers", "Lakers");
        addTagIfContains(tags, combined, "warriors", "Warriors");
        addTagIfContains(tags, combined, "chiefs", "Chiefs");
        addTagIfContains(tags, combined, "cowboys", "Cowboys");
        addTagIfContains(tags, combined, "manchester united", "Manchester United");
        addTagIfContains(tags, combined, "real madrid", "Real Madrid");
        
        // Add source as tag
        String sourceName = getSourceName(articleNode);
        if (sourceName != null) {
            tags.add(sourceName);
        }
        
        return tags;
    }
    
    /**
     * Add tag if keyword is found in text
     */
    private void addTagIfContains(List<String> tags, String text, String keyword, String tag) {
        if (text.contains(keyword)) {
            tags.add(tag);
        }
    }
    
    /**
     * Clean title (remove source suffix)
     */
    private String cleanTitle(String title) {
        if (title == null) return null;
        // Remove " - Source Name" suffix
        int dashIndex = title.lastIndexOf(" - ");
        if (dashIndex > 0) {
            return title.substring(0, dashIndex).trim();
        }
        return title.trim();
    }
    
    /**
     * Clean content (remove character limit notice)
     */
    private String cleanContent(String content) {
        if (content == null) return null;
        // NewsAPI truncates content with "[+XXXX chars]"
        int bracketIndex = content.lastIndexOf("[+");
        if (bracketIndex > 0) {
            return content.substring(0, bracketIndex).trim();
        }
        return content.trim();
    }
}
