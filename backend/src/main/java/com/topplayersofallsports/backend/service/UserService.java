package com.topplayersofallsports.backend.service;

import com.topplayersofallsports.backend.model.User;
import com.topplayersofallsports.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service layer for User entity operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    
    /**
     * Create a new user
     */
    public User createUser(User user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists: " + user.getEmail());
        }
        
        // Encode password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Set default values
        user.setIsActive(true);
        user.setIsVerified(false);
        user.setRole(User.UserRole.USER);
        
        User savedUser = userRepository.save(user);
        
        // Send welcome email
        try {
            emailService.sendWelcomeEmail(savedUser);
        } catch (Exception e) {
            log.error("Failed to send welcome email to user: {}", savedUser.getEmail(), e);
        }
        
        log.info("Created new user: {}", savedUser.getEmail());
        return savedUser;
    }
    
    /**
     * Find user by ID
     */
    @Transactional(readOnly = true)
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    /**
     * Find user by email
     */
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * Update user profile
     */
    public User updateUser(Long id, User userUpdates) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        
        // Update allowed fields
        if (userUpdates.getFirstName() != null) {
            existingUser.setFirstName(userUpdates.getFirstName());
        }
        if (userUpdates.getLastName() != null) {
            existingUser.setLastName(userUpdates.getLastName());
        }
        if (userUpdates.getBio() != null) {
            existingUser.setBio(userUpdates.getBio());
        }
        if (userUpdates.getPhone() != null) {
            existingUser.setPhone(userUpdates.getPhone());
        }
        if (userUpdates.getCountry() != null) {
            existingUser.setCountry(userUpdates.getCountry());
        }
        if (userUpdates.getFavoriteSports() != null) {
            existingUser.setFavoriteSports(userUpdates.getFavoriteSports());
        }
        if (userUpdates.getFavoriteTeams() != null) {
            existingUser.setFavoriteTeams(userUpdates.getFavoriteTeams());
        }
        if (userUpdates.getAvatarUrl() != null) {
            existingUser.setAvatarUrl(userUpdates.getAvatarUrl());
        }
        
        return userRepository.save(existingUser);
    }
    
    /**
     * Change user password
     */
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        log.info("Password changed for user: {}", user.getEmail());
    }
    
    /**
     * Verify user email
     */
    public void verifyUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        user.setIsVerified(true);
        userRepository.save(user);
        
        log.info("Verified user: {}", user.getEmail());
    }
    
    /**
     * Deactivate user
     */
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        user.setIsActive(false);
        userRepository.save(user);
        
        log.info("Deactivated user: {}", user.getEmail());
    }
    
    /**
     * Get all users with pagination
     */
    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }
    
    /**
     * Search users
     */
    @Transactional(readOnly = true)
    public Page<User> searchUsers(String search, Pageable pageable) {
        return userRepository.searchUsers(search, pageable);
    }
    
    /**
     * Get user statistics
     */
    @Transactional(readOnly = true)
    public UserStats getUserStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();
        long verifiedUsers = userRepository.countByIsVerifiedTrue();
        
        return new UserStats(totalUsers, activeUsers, verifiedUsers);
    }
    
    /**
     * User statistics DTO
     */
    public record UserStats(long totalUsers, long activeUsers, long verifiedUsers) {}
}
