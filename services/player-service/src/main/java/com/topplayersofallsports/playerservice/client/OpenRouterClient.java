package com.topplayersofallsports.playerservice.client;

import com.topplayersofallsports.playerservice.config.OpenRouterConfig;
import com.topplayersofallsports.playerservice.dto.openrouter.OpenRouterRequest;
import com.topplayersofallsports.playerservice.dto.openrouter.OpenRouterResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

@Service
@Slf4j
public class OpenRouterClient {
    
    private final OpenRouterConfig config;
    private final WebClient webClient;
    
    public OpenRouterClient(OpenRouterConfig config) {
        this.config = config;
        this.webClient = WebClient.builder()
            .baseUrl(config.getBaseUrl())
            .defaultHeader("Authorization", "Bearer " + config.getApiKey())
            .defaultHeader("HTTP-Referer", config.getSiteUrl())
            .defaultHeader("X-Title", config.getSiteName())
            .defaultHeader("Content-Type", "application/json")
            .build();
    }
    
    /**
     * Send a chat completion request to a specific model via OpenRouter
     */
    public String chat(String prompt, Double temperature, String model) {
        String modelToUse = (model != null && !model.isBlank()) ? model : config.getModel();
        log.info("Sending chat request to {} via OpenRouter", modelToUse);
        
        OpenRouterRequest request = OpenRouterRequest.builder()
            .model(modelToUse)
            .messages(List.of(
                OpenRouterRequest.Message.builder()
                    .role("user")
                    .content(prompt)
                    .build()
            ))
            .maxTokens(config.getMaxTokens())
            .temperature(temperature != null ? temperature : 0.7)
            .build();
        
        try {
            OpenRouterResponse response = webClient.post()
                .uri("/chat/completions")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OpenRouterResponse.class)
                .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)))
                .block();
            
            if (response != null && !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent();
                log.info("Received response from {}. Tokens used: {}", modelToUse,
                    response.getUsage().getTotalTokens());
                return content;
            }
            
            log.error("Empty response from OpenRouter");
            throw new RuntimeException("Empty response from OpenRouter API");
            
        } catch (Exception e) {
            log.error("Error calling OpenRouter API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get AI response: " + e.getMessage(), e);
        }
    }
    
    /**
     * Convenience method with default temperature and default model
     */
    public String chat(String prompt, Double temperature) {
        return chat(prompt, temperature, null);
    }
    
    /**
     * Convenience method with default temperature
     */
    public String chat(String prompt) {
        return chat(prompt, 0.7, null);
    }
}
