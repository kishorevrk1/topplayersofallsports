package com.topplayersofallsports.backend.service;

import com.topplayersofallsports.backend.model.User;
import com.topplayersofallsports.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;

/**
 * Custom UserDetailsService implementation for Spring Security
 * Follows security best practices
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Loading user by email: {}", email);
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Failed to find user '{}'", email);
                    return new UsernameNotFoundException("User not found: " + email);
                });
        
        // Update last login - moved to login success handler for better separation of concerns
        // user.setLastLogin(LocalDateTime.now());
        // userRepository.save(user);
        
        log.debug("Successfully loaded user: {}", user.getEmail());
        return new CustomUserPrincipal(user);
    }
    
    /**
     * Update user's last login time
     */
    @Transactional
    public void updateLastLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
            log.debug("Updated last login for user: {}", email);
        });
    }
    
    /**
     * Custom UserDetails implementation with enhanced security
     */
    public static class CustomUserPrincipal implements UserDetails {
        private final User user;
        
        public CustomUserPrincipal(User user) {
            this.user = user;
        }
        
        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            Collection<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
            return authorities;
        }
        
        @Override
        public String getPassword() {
            return user.getPassword();
        }
        
        @Override
        public String getUsername() {
            return user.getEmail();
        }
        
        @Override
        public boolean isAccountNonExpired() {
            // Could implement account expiration logic based on user.getCreatedAt()
            return true;
        }
        
        @Override
        public boolean isAccountNonLocked() {
            // Account is not locked if user is active
            return user.getIsActive();
        }
        
        @Override
        public boolean isCredentialsNonExpired() {
            // Could implement password expiration logic
            return true;
        }
        
        @Override
        public boolean isEnabled() {
            // User is enabled if account is active
            // Email verification can be handled separately in business logic
            return user.getIsActive();
        }
        
        // Helper methods for accessing user data
        public User getUser() {
            return user;
        }
        
        public Long getId() {
            return user.getId();
        }
        
        public String getFullName() {
            return user.getFullName();
        }
        
        public String getEmail() {
            return user.getEmail();
        }
        
        public boolean isVerified() {
            return user.getIsVerified();
        }
        
        public User.UserRole getRole() {
            return user.getRole();
        }
    }
}
