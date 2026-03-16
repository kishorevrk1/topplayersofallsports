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
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Slf4j
public class OpenRouterClient {
    
    private final OpenRouterConfig config;
    private final WebClient webClient;
    private final AtomicInteger requestCount = new AtomicInteger(0);
    
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
        int count = requestCount.incrementAndGet();
        log.info("[OpenRouter] Request #{} to model={}", count, modelToUse);
        
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
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                    clientResponse -> clientResponse.bodyToMono(String.class)
                        .doOnNext(body -> log.error("OpenRouter error [{}] for model {}: {}",
                            clientResponse.statusCode(), modelToUse, body))
                        .map(body -> new RuntimeException(
                            "OpenRouter API error " + clientResponse.statusCode() + ": " + body)))
                .bodyToMono(OpenRouterResponse.class)
                .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .retryWhen(Retry.backoff(3, Duration.ofSeconds(10))
                    .maxBackoff(Duration.ofSeconds(30))
                    .filter(e -> !(e instanceof RuntimeException re &&
                        (re.getMessage().contains("404") || re.getMessage().contains("401")))))
                .block();

            if (response != null && !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent();
                log.info("[OpenRouter] Request #{} completed (model={}). Tokens used: {}", count, modelToUse,
                    response.getUsage() != null ? response.getUsage().getTotalTokens() : "?");
                return content;
            }

            log.error("Empty response from OpenRouter for model {}", modelToUse);
            throw new RuntimeException("Empty response from OpenRouter API");

        } catch (Exception e) {
            log.error("Error calling OpenRouter API for model {}: {}", modelToUse, e.getMessage());
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
