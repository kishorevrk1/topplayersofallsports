package com.topplayersofallsports.playerservice.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.topplayersofallsports.playerservice.config.AnthropicConfig;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

/**
 * Direct Anthropic Messages API client.
 * Calls https://api.anthropic.com/v1/messages with the native Anthropic request format.
 * No OpenRouter proxy — uses the api-key directly, no Venice rate limiting.
 */
@Service
@Slf4j
public class AnthropicClient {

    private final AnthropicConfig config;
    private final WebClient webClient;

    public AnthropicClient(AnthropicConfig config) {
        this.config = config;
        this.webClient = WebClient.builder()
            .baseUrl("https://api.anthropic.com")
            .defaultHeader("x-api-key", config.getApiKey())
            .defaultHeader("anthropic-version", "2023-06-01")
            .defaultHeader("content-type", "application/json")
            .build();
    }

    /**
     * Send a prompt and return the text response.
     * Temperature is passed through to Anthropic (0.0 – 1.0).
     */
    public String chat(String prompt, Double temperature) {
        AnthropicRequest request = AnthropicRequest.builder()
            .model(config.getModel())
            .maxTokens(config.getMaxTokens())
            .temperature(temperature != null ? temperature : 0.7)
            .messages(List.of(new AnthropicRequest.Message("user", prompt)))
            .build();

        log.info("Sending request to Anthropic API (model: {})", config.getModel());

        try {
            AnthropicResponse response = webClient.post()
                .uri("/v1/messages")
                .bodyValue(request)
                .retrieve()
                .onStatus(
                    status -> status.is4xxClientError() || status.is5xxServerError(),
                    clientResponse -> clientResponse.bodyToMono(String.class)
                        .doOnNext(body -> log.error("Anthropic error [{}]: {}",
                            clientResponse.statusCode(), body))
                        .map(body -> new RuntimeException(
                            "Anthropic API error " + clientResponse.statusCode() + ": " + body)))
                .bodyToMono(AnthropicResponse.class)
                .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(5))
                    .maxBackoff(Duration.ofSeconds(20))
                    .filter(e -> !(e instanceof RuntimeException re &&
                        (re.getMessage().contains("400") || re.getMessage().contains("401")))))
                .block();

            if (response != null && response.getContent() != null && !response.getContent().isEmpty()) {
                String text = response.getContent().get(0).getText();
                log.info("Anthropic response received. Output tokens: {}",
                    response.getUsage() != null ? response.getUsage().getOutputTokens() : "?");
                return text;
            }

            throw new RuntimeException("Empty response from Anthropic API");

        } catch (Exception e) {
            log.error("Error calling Anthropic API: {}", e.getMessage());
            throw new RuntimeException("Failed to get AI response: " + e.getMessage(), e);
        }
    }

    // ── Request ──────────────────────────────────────────────────────────────

    @Data
    @lombok.Builder
    @NoArgsConstructor
    @lombok.AllArgsConstructor
    static class AnthropicRequest {
        private String model;

        @JsonProperty("max_tokens")
        private Integer maxTokens;

        private Double temperature;
        private List<Message> messages;

        record Message(String role, String content) {}
    }

    // ── Response ─────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    static class AnthropicResponse {
        private List<ContentBlock> content;
        private Usage usage;

        @Data
        @NoArgsConstructor
        static class ContentBlock {
            private String type;
            private String text;
        }

        @Data
        @NoArgsConstructor
        static class Usage {
            @JsonProperty("input_tokens")
            private Integer inputTokens;

            @JsonProperty("output_tokens")
            private Integer outputTokens;
        }
    }
}
