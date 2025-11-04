package com.topplayersofallsports.highlights.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Redis cache configuration for highlights service.
 * 
 * Configures different TTLs for different cache types:
 * - Trending: 5 minutes (frequently changing)
 * - Featured: 10 minutes (moderately stable)
 * - Highlights: 10 minutes (default)
 * - Player videos: 15 minutes (more stable)
 * 
 * Production-ready with proper serialization and TTL management.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${highlights.cache.trending-ttl-seconds:300}")
    private long trendingTtlSeconds;

    @Value("${highlights.cache.highlights-ttl-seconds:600}")
    private long highlightsTtlSeconds;

    /**
     * Configure Redis cache manager with custom TTLs per cache.
     * Includes Java 8 date/time support for Instant serialization.
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Configure ObjectMapper with Java 8 date/time module
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Default cache configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofSeconds(highlightsTtlSeconds))
            .serializeKeysWith(
                RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
            )
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer(objectMapper)
                )
            )
            .disableCachingNullValues();

        // Custom configurations for specific caches
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Trending cache - 5 minutes (frequently changing)
        cacheConfigurations.put("trending", 
            defaultConfig.entryTtl(Duration.ofSeconds(trendingTtlSeconds)));
        
        // Featured cache - 10 minutes
        cacheConfigurations.put("featured", 
            defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // Player videos cache - 15 minutes (more stable)
        cacheConfigurations.put("playerVideos", 
            defaultConfig.entryTtl(Duration.ofMinutes(15)));
        
        // Video counts cache - 30 minutes (very stable)
        cacheConfigurations.put("videoCounts", 
            defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
    }
}
