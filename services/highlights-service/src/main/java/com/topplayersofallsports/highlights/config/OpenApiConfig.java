package com.topplayersofallsports.highlights.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI (Swagger) configuration for API documentation.
 * 
 * Provides interactive API documentation at /api/swagger-ui.html
 * and OpenAPI spec at /api/docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${spring.application.name:highlights-service}")
    private String applicationName;

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public OpenAPI highlightsServiceOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("HighlightsSvc API")
                .description("Video Highlights Microservice - Ingest, store, and serve sports video highlights from YouTube and other platforms")
                .version("1.0.0")
                .contact(new Contact()
                    .name("TopPlayersOfAllSports Team")
                    .email("dev@topplayersofallsports.com"))
                .license(new License()
                    .name("Proprietary")
                    .url("https://topplayersofallsports.com/license")))
            .servers(List.of(
                new Server()
                    .url("http://localhost:" + serverPort)
                    .description("Local development server"),
                new Server()
                    .url("https://api.topplayersofallsports.com")
                    .description("Production server")
            ));
    }
}
