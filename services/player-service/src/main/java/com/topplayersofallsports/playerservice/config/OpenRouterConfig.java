package com.topplayersofallsports.playerservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "openrouter")
@Data
public class OpenRouterConfig {
    private String apiKey;
    private String baseUrl;
    private String model;
    /** Secondary model for consensus cross-checking (e.g. openai/gpt-4o-mini) */
    private String secondaryModel;
    private String siteUrl;
    private String siteName;
    private Integer timeoutSeconds;
    private Integer maxTokens;
}
