package com.topplayersofallsports.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for TopPlayersofAllSports Backend API
 * 
 * This Spring Boot application provides RESTful APIs for:
 * - User authentication and authorization
 * - Sports content management (news, players, videos)
 * - AI-powered content generation
 * - Search and filtering functionality
 * - Real-time notifications
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableAsync
@EnableScheduling
public class TopPlayersofAllSportsBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(TopPlayersofAllSportsBackendApplication.class, args);
    }
}
