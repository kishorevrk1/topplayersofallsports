package com.topplayers.calendar.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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

/**
 * Redis Configuration
 * Configures JSON serialization for caching with Java 8 date/time support
 */
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * Configure ObjectMapper with Java 8 date/time support
     * Clean JSON without @class type metadata
     */
    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Register JavaTimeModule for LocalDateTime, LocalDate, etc.
        objectMapper.registerModule(new JavaTimeModule());
        
        // No polymorphic type info needed for cache (internal use only)
        // This produces cleaner JSON without @class annotations
        
        return objectMapper;
    }

    /**
     * Configure Redis Cache Manager with JSON serialization
     * Uses Jackson with Java 8 date/time module support
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer serializer = 
                new GenericJackson2JsonRedisSerializer(redisObjectMapper());
        
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(15)) // 15 seconds TTL for live data
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()
                        )
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer)
                )
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .transactionAware()
                .build();
    }
}
