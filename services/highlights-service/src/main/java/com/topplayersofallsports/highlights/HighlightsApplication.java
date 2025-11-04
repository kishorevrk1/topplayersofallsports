package com.topplayersofallsports.highlights;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application entry point for HighlightsSvc.
 * 
 * Production-grade microservice for ingesting and serving sports video highlights
 * using Temporal for durable workflow execution.
 * 
 * @author TopPlayersOfAllSports Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableCaching
@EnableScheduling  // Enable scheduled tasks for periodic ingest
public class HighlightsApplication {

    public static void main(String[] args) {
        SpringApplication.run(HighlightsApplication.class, args);
    }
}
