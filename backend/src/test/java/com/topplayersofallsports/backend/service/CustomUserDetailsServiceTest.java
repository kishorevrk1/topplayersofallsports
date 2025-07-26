package com.topplayersofallsports.backend.service;

import com.topplayersofallsports.backend.model.User;
import com.topplayersofallsports.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CustomUserDetailsService
 * Tests authentication logic without Spring context
 */
@ExtendWith(MockitoExtension.class)
public class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPassword("hashedPassword");
        testUser.setIsVerified(true);
        testUser.setIsActive(true);
        testUser.setRole(User.UserRole.USER);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void testLoadUserByUsername_Success() {
        // Arrange
        when(userRepository.findByEmail("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class)))
                .thenReturn(testUser);

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("john.doe@example.com");

        // Assert
        assertNotNull(userDetails);
        assertEquals("john.doe@example.com", userDetails.getUsername());
        assertEquals("hashedPassword", userDetails.getPassword());
        assertTrue(userDetails.isEnabled());
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());
        assertFalse(userDetails.getAuthorities().isEmpty());

        // Verify that last login was updated
        verify(userRepository).save(any(User.class));
    }

    @Test
    void testLoadUserByUsername_UserNotFound() {
        // Arrange
        when(userRepository.findByEmail("nonexistent@example.com"))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class, () -> {
            customUserDetailsService.loadUserByUsername("nonexistent@example.com");
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLoadUserByUsername_InactiveUser() {
        // Arrange
        testUser.setIsActive(false);
        when(userRepository.findByEmail("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class)))
                .thenReturn(testUser);

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("john.doe@example.com");

        // Assert
        assertNotNull(userDetails);
        assertFalse(userDetails.isEnabled()); // Should be disabled due to isActive = false
    }

    @Test
    void testLoadUserByUsername_UnverifiedUser() {
        // Arrange
        testUser.setIsVerified(false);
        when(userRepository.findByEmail("john.doe@example.com"))
                .thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class)))
                .thenReturn(testUser);

        // Act
        UserDetails userDetails = customUserDetailsService.loadUserByUsername("john.doe@example.com");

        // Assert
        assertNotNull(userDetails);
        assertFalse(userDetails.isEnabled()); // Should be disabled due to isVerified = false
    }

    @Test
    void testCustomUserPrincipal() {
        // Test the CustomUserPrincipal inner class
        CustomUserDetailsService.CustomUserPrincipal principal = 
                new CustomUserDetailsService.CustomUserPrincipal(testUser);

        assertEquals(testUser, principal.getUser());
        assertEquals("john.doe@example.com", principal.getUsername());
        assertEquals("hashedPassword", principal.getPassword());
        assertTrue(principal.isEnabled());
        assertTrue(principal.isAccountNonExpired());
        assertTrue(principal.isAccountNonLocked());
        assertTrue(principal.isCredentialsNonExpired());
        
        // Test authorities
        assertFalse(principal.getAuthorities().isEmpty());
        assertTrue(principal.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_USER")));
    }
}
