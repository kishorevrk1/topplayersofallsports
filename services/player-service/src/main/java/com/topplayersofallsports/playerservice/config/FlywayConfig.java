package com.topplayersofallsports.playerservice.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    /**
     * Repair any previously failed migrations before running new ones.
     * Safe to run always — repair is a no-op when there are no failed migrations.
     */
    @Bean
    public FlywayMigrationStrategy repairThenMigrate() {
        return flyway -> {
            flyway.repair();   // clears any failed migration markers from history
            flyway.migrate();
        };
    }
}
