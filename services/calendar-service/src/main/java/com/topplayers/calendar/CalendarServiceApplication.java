package com.topplayers.calendar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Calendar Service Application
 * 
 * Production-grade microservice for football fixtures and calendar data.
 * Features:
 * - Temporal workflow orchestration for automated syncing
 * - Redis caching for performance
 * - API-Sports.io integration
 * - Real-time live score updates
 * - Top 4 football leagues support
 * 
 * @author TopPlayersOfAllSports
 * @version 1.0.0
 */
@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
public class CalendarServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CalendarServiceApplication.class, args);
    }
}
