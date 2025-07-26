package com.topplayersofallsports.backend.service;

import com.topplayersofallsports.backend.model.User;
import com.topplayersofallsports.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Custom OAuth2 User Service for handling OAuth2 user registration and login
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        try {
            return processOAuth2User(userRequest, oauth2User);
        } catch (Exception ex) {
            log.error("Error processing OAuth2 user", ex);
            throw new OAuth2AuthenticationException("Error processing OAuth2 user: " + ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oauth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oauth2User.getAttributes();

        // Extract user info based on provider
        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

        if (userInfo.getEmail() == null || userInfo.getEmail().isEmpty()) {
            throw new OAuth2AuthenticationException("Email not found from OAuth2 provider");
        }

        Optional<User> userOptional = userRepository.findByEmail(userInfo.getEmail());
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            // Update user if provider info changed
            if (!registrationId.equals(user.getProvider())) {
                user.setProvider(registrationId);
                user.setProviderId(userInfo.getId());
                user.setAvatarUrl(userInfo.getImageUrl());
                user = userRepository.save(user);
            }
        } else {
            // Register new user
            user = registerNewUser(userInfo, registrationId);
        }

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        user = userRepository.save(user);

        return new CustomOAuth2UserPrincipal(user, oauth2User.getAttributes());
    }

    private User registerNewUser(OAuth2UserInfo userInfo, String provider) {
        User user = new User();
        
        // Parse name - try to split first and last name
        String name = userInfo.getName();
        String[] nameParts = name != null ? name.split("\\s+", 2) : new String[]{"", ""};
        
        user.setFirstName(nameParts.length > 0 ? nameParts[0] : "User");
        user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        user.setEmail(userInfo.getEmail());
        user.setAvatarUrl(userInfo.getImageUrl());
        user.setProvider(provider);
        user.setProviderId(userInfo.getId());
        user.setIsVerified(true); // OAuth2 users are considered verified
        user.setIsActive(true);
        user.setRole(User.UserRole.USER);
        
        // Set a random password (not used for OAuth2 users)
        user.setPassword("oauth2-user-" + System.currentTimeMillis());

        log.info("Registering new OAuth2 user: {} with provider: {}", user.getEmail(), provider);
        
        return userRepository.save(user);
    }

    /**
     * Factory for creating OAuth2UserInfo based on provider
     */
    private static class OAuth2UserInfoFactory {
        public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
            if ("google".equalsIgnoreCase(registrationId)) {
                return new GoogleOAuth2UserInfo(attributes);
            } else {
                throw new OAuth2AuthenticationException("Unsupported OAuth2 provider: " + registrationId);
            }
        }
    }

    /**
     * Abstract OAuth2 user info
     */
    private abstract static class OAuth2UserInfo {
        protected Map<String, Object> attributes;

        public OAuth2UserInfo(Map<String, Object> attributes) {
            this.attributes = attributes;
        }

        public abstract String getId();
        public abstract String getName();
        public abstract String getEmail();
        public abstract String getImageUrl();
    }

    /**
     * Google OAuth2 user info
     */
    private static class GoogleOAuth2UserInfo extends OAuth2UserInfo {
        public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
            super(attributes);
        }

        @Override
        public String getId() {
            return (String) attributes.get("sub");
        }

        @Override
        public String getName() {
            return (String) attributes.get("name");
        }

        @Override
        public String getEmail() {
            return (String) attributes.get("email");
        }

        @Override
        public String getImageUrl() {
            return (String) attributes.get("picture");
        }
    }
}
