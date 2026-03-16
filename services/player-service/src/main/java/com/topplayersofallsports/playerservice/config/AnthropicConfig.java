package com.topplayersofallsports.playerservice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "anthropic")
@Data
public class AnthropicConfig {
    private String apiKey;
    private String model = "claude-3-5-haiku-20241022";
    private Integer maxTokens = 4096;
    private Integer timeoutSeconds = 120;
}
