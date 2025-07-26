package com.topplayersofallsports.backend.dto;

import com.topplayersofallsports.backend.model.User;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO for User entity responses
 */
@Data
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String avatarUrl;
    private String bio;
    private String phone;
    private LocalDateTime dateOfBirth;
    private String country;
    private String favoriteSports;
    private String favoriteTeams;
    private Boolean isVerified;
    private Boolean isActive;
    private LocalDateTime lastLogin;
    private User.UserRole role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
