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
    private String siteUrl;
    private String siteName;
    private Integer timeoutSeconds;
    private Integer maxTokens;
}
