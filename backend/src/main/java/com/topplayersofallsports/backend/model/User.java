package com.topplayersofallsports.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * User entity representing authenticated users in the system
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    
    @NotBlank
    @Size(max = 50)
    @Column(name = "first_name", nullable = false)
    private String firstName;
    
    @NotBlank
    @Size(max = 50)
    @Column(name = "last_name", nullable = false)
    private String lastName;
    
    @NotBlank
    @Email
    @Size(max = 100)
    @Column(name = "email", nullable = false, unique = true)
    private String email;
    
    @NotBlank
    @Size(min = 8, max = 100)
    @Column(name = "password", nullable = false)
    private String password;
    
    @Column(name = "avatar_url")
    private String avatarUrl;
    
    @Column(name = "bio", length = 500)
    private String bio;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "date_of_birth")
    private LocalDateTime dateOfBirth;
    
    @Column(name = "country")
    private String country;
    
    @Column(name = "favorite_sports")
    private String favoriteSports; // JSON array stored as string
    
    @Column(name = "favorite_teams")
    private String favoriteTeams; // JSON array stored as string
    
    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role = UserRole.USER;
    
    // OAuth2 fields
    @Column(name = "provider")
    private String provider;
    
    @Column(name = "provider_id")
    private String providerId;
    
    // Relationships
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<NewsArticle> articles = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Comment> comments = new HashSet<>();
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<UserFavorite> favorites = new HashSet<>();
    
    public enum UserRole {
        ADMIN, MODERATOR, EDITOR, USER
    }
    
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
