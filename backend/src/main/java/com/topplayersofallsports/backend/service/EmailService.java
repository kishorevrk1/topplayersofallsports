package com.topplayersofallsports.backend.service;

import com.topplayersofallsports.backend.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    /**
     * Send welcome email to new user
     */
    @Async
    public void sendWelcomeEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Welcome to TopPlayersofAllSports!");
            message.setText(buildWelcomeEmailText(user));
            
            mailSender.send(message);
            log.info("Welcome email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", user.getEmail(), e);
        }
    }
    
    /**
     * Send password reset email
     */
    @Async
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Password Reset - TopPlayersofAllSports");
            message.setText(buildPasswordResetEmailText(user, resetToken));
            
            mailSender.send(message);
            log.info("Password reset email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", user.getEmail(), e);
        }
    }
    
    /**
     * Send email verification
     */
    @Async
    public void sendVerificationEmail(User user, String verificationToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Email Verification - TopPlayersofAllSports");
            message.setText(buildVerificationEmailText(user, verificationToken));
            
            mailSender.send(message);
            log.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", user.getEmail(), e);
        }
    }
    
    private String buildWelcomeEmailText(User user) {
        return String.format("""
            Dear %s,
            
            Welcome to TopPlayersofAllSports!
            
            Thank you for joining our community of sports enthusiasts. You now have access to:
            - Latest sports news and breaking updates
            - Player profiles and statistics
            - Video highlights from all major sports
            - Personalized content based on your favorite sports and teams
            
            Get started by exploring our platform and customizing your preferences.
            
            Best regards,
            The TopPlayersofAllSports Team
            """, user.getFullName());
    }
    
    private String buildPasswordResetEmailText(User user, String resetToken) {
        return String.format("""
            Dear %s,
            
            You have requested to reset your password for TopPlayersofAllSports.
            
            Please use the following token to reset your password: %s
            
            This token will expire in 1 hour for security reasons.
            
            If you didn't request this password reset, please ignore this email.
            
            Best regards,
            The TopPlayersofAllSports Team
            """, user.getFullName(), resetToken);
    }
    
    private String buildVerificationEmailText(User user, String verificationToken) {
        return String.format("""
            Dear %s,
            
            Please verify your email address for TopPlayersofAllSports.
            
            Verification token: %s
            
            Click the verification link in your account settings and enter this token.
            
            Best regards,
            The TopPlayersofAllSports Team
            """, user.getFullName(), verificationToken);
    }
}
