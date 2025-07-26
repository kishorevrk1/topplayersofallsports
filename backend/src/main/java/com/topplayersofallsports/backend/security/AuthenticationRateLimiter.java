package com.topplayersofallsports.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiter for authentication endpoints to prevent brute force attacks
 */
@Component
@Slf4j
public class AuthenticationRateLimiter {
    
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;
    
    private final ConcurrentHashMap<String, AttemptInfo> attemptCache = new ConcurrentHashMap<>();
    
    /**
     * Check if the IP address is allowed to make authentication attempts
     */
    public boolean isAllowed(String ipAddress) {
        AttemptInfo attemptInfo = attemptCache.get(ipAddress);
        
        if (attemptInfo == null) {
            return true;
        }
        
        // Check if lockout period has expired
        if (attemptInfo.isLockoutExpired()) {
            attemptCache.remove(ipAddress);
            return true;
        }
        
        // Check if max attempts exceeded
        return attemptInfo.getAttempts() < MAX_ATTEMPTS;
    }
    
    /**
     * Record a failed authentication attempt
     */
    public void recordFailedAttempt(String ipAddress) {
        AttemptInfo attemptInfo = attemptCache.computeIfAbsent(ipAddress, k -> new AttemptInfo());
        attemptInfo.incrementAttempts();
        
        if (attemptInfo.getAttempts() >= MAX_ATTEMPTS) {
            attemptInfo.setLockoutTime(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
            log.warn("IP address {} has been locked out due to too many failed login attempts", ipAddress);
        }
    }
    
    /**
     * Record a successful authentication attempt (clears failed attempts)
     */
    public void recordSuccessfulAttempt(String ipAddress) {
        attemptCache.remove(ipAddress);
    }
    
    /**
     * Get the client IP address from the request, handling proxy headers
     */
    public String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        String xForwardedProto = request.getHeader("X-Forwarded-Proto");
        if (xForwardedProto != null && !xForwardedProto.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedProto)) {
            return request.getHeader("X-Forwarded-For");
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Get remaining lockout time in minutes
     */
    public long getRemainingLockoutMinutes(String ipAddress) {
        AttemptInfo attemptInfo = attemptCache.get(ipAddress);
        if (attemptInfo == null || attemptInfo.getLockoutTime() == null) {
            return 0;
        }
        
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(attemptInfo.getLockoutTime())) {
            return 0;
        }
        
        return java.time.Duration.between(now, attemptInfo.getLockoutTime()).toMinutes();
    }
    
    /**
     * Inner class to track attempt information
     */
    private static class AttemptInfo {
        private final AtomicInteger attempts = new AtomicInteger(0);
        private LocalDateTime lockoutTime;
        
        public int getAttempts() {
            return attempts.get();
        }
        
        public void incrementAttempts() {
            attempts.incrementAndGet();
        }
        
        public LocalDateTime getLockoutTime() {
            return lockoutTime;
        }
        
        public void setLockoutTime(LocalDateTime lockoutTime) {
            this.lockoutTime = lockoutTime;
        }
        
        public boolean isLockoutExpired() {
            return lockoutTime == null || LocalDateTime.now().isAfter(lockoutTime);
        }
    }
}
