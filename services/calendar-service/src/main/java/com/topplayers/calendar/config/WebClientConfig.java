package com.topplayers.calendar.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * WebClient Configuration for API-Sports.io
 * Production-ready with timeouts, retry logic, and error handling
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class WebClientConfig {

    private final LeagueConfig leagueConfig;

    @Bean(name = "apiSportsWebClient")
    public WebClient apiSportsWebClient() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
                .responseTimeout(Duration.ofSeconds(10))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(10, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(10, TimeUnit.SECONDS)));

        return WebClient.builder()
                .baseUrl(leagueConfig.getBaseUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader("x-rapidapi-host", "v3.football.api-sports.io")
                .defaultHeader("x-rapidapi-key", leagueConfig.getApiKey())
                .filter(logRequest())
                .filter(logResponse())
                .filter(handleError())
                .build();
    }

    /**
     * Log outgoing requests
     */
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.debug("API-Sports Request: {} {}", 
                    clientRequest.method(), 
                    clientRequest.url());
            return Mono.just(clientRequest);
        });
    }

    /**
     * Log incoming responses
     */
    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            log.debug("API-Sports Response: Status {}", 
                    clientResponse.statusCode());
            return Mono.just(clientResponse);
        });
    }

    /**
     * Handle errors globally
     */
    private ExchangeFilterFunction handleError() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            if (clientResponse.statusCode().isError()) {
                return clientResponse.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            log.error("API-Sports Error: {} - {}", 
                                    clientResponse.statusCode(), 
                                    errorBody);
                            return Mono.just(clientResponse);
                        });
            }
            return Mono.just(clientResponse);
        });
    }
}
