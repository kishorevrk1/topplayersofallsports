package com.topplayersofallsports.playerservice.scheduler;

import com.topplayersofallsports.playerservice.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@Slf4j
@RequiredArgsConstructor
public class RefreshTokenCleanupTask {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Runs nightly at 03:00 AM to purge expired refresh tokens.
     * Keeps the refresh_tokens table lean in production.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        log.info("Starting nightly refresh-token cleanup");
        refreshTokenRepository.deleteAllExpired(LocalDateTime.now());
        log.info("Refresh-token cleanup complete");
    }
}
