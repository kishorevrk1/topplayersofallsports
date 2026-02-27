package com.topplayersofallsports.news;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Sports News Aggregation Microservice
 * 
 * Fetches and stores sports news from NewsAPI
 * Updates every 6 hours via Temporal workflow
 * Serves news via REST API
 */
@SpringBootApplication
@EnableCaching
@EnableScheduling
public class NewsServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NewsServiceApplication.class, args);
    }
}
