package com.topplayersofallsports.backend.repository;

import com.topplayersofallsports.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User entity operations
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find user by email address
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Check if user exists by email
     */
    boolean existsByEmail(String email);
    
    /**
     * Find users by role
     */
    Page<User> findByRole(User.UserRole role, Pageable pageable);
    
    /**
     * Find active users
     */
    Page<User> findByIsActiveTrue(Pageable pageable);
    
    /**
     * Find verified users
     */
    Page<User> findByIsVerifiedTrue(Pageable pageable);
    
    /**
     * Search users by name or email
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);
    
    /**
     * Find users by country
     */
    Page<User> findByCountry(String country, Pageable pageable);
    
    /**
     * Count active users
     */
    long countByIsActiveTrue();
    
    /**
     * Count verified users
     */
    long countByIsVerifiedTrue();
}
