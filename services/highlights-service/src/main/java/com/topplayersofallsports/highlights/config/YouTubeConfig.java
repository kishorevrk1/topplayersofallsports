package com.topplayersofallsports.highlights.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.youtube.YouTube;
import com.topplayersofallsports.highlights.infrastructure.youtube.YouTubeClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * YouTube Data API v3 configuration.
 * 
 * Configures YouTube client for fetching video highlights from official channels/playlists.
 * Production-ready with proper error handling and quota management.
 */
@Configuration
@Slf4j
public class YouTubeConfig {

    @Value("${youtube.api-key}")
    private String apiKey;

    @Value("${spring.application.name:highlights-service}")
    private String applicationName;

    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * Create YouTube Data API client.
     */
    @Bean
    public YouTube youTube() throws GeneralSecurityException, IOException {
        log.info("Initializing YouTube Data API client");
        
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("your-youtube-api-key-here")) {
            log.warn("YouTube API key not configured. Service will not be able to ingest videos.");
            log.warn("Please set YOUTUBE_API_KEY environment variable.");
        }
        
        final NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        
        YouTube youtube = new YouTube.Builder(httpTransport, JSON_FACTORY, request -> {})
            .setApplicationName(applicationName)
            .build();
        
        log.info("YouTube Data API client initialized successfully");
        return youtube;
    }

    /**
     * Create YouTubeClient wrapper.
     */
    @Bean
    public YouTubeClient youTubeClient(YouTube youTube) {
        return new YouTubeClient(youTube, apiKey);
    }
}
