package com.topplayersofallsports.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for HTTP clients and REST templates
 */
@Configuration
@Slf4j
public class RestClientConfig {

    /**
     * Configure RestTemplate with proper timeouts and error handling
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        RestTemplate restTemplate = builder
            .setConnectTimeout(Duration.ofSeconds(10))
            .setReadTimeout(Duration.ofSeconds(30))
            .additionalInterceptors(loggingInterceptor())
            .build();
        
        log.info("RestTemplate configured with 10s connect timeout and 30s read timeout");
        return restTemplate;
    }

    /**
     * HTTP request logging interceptor
     */
    private ClientHttpRequestInterceptor loggingInterceptor() {
        return (request, body, execution) -> {
            log.debug("HTTP {} to {}", request.getMethod(), request.getURI());
            return execution.execute(request, body);
        };
    }
}
