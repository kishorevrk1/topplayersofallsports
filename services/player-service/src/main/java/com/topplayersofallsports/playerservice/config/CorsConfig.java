package com.topplayersofallsports.playerservice.config;

/**
 * CORS is now configured centrally in SecurityConfig via CorsConfigurationSource.
 * This class is intentionally empty — previously it registered a CorsFilter bean
 * that has been merged into SecurityConfig to avoid duplicate CORS handling.
 */
public class CorsConfig {
    // No beans. All CORS settings live in SecurityConfig#corsConfigurationSource().
}
