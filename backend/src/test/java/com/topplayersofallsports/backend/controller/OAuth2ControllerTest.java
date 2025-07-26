package com.topplayersofallsports.backend.controller;

import com.topplayersofallsports.backend.service.CustomOAuth2UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test cases for OAuth2Controller
 * Tests OAuth2 Google authentication flow
 */
@WebMvcTest(OAuth2Controller.class)
public class OAuth2ControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomOAuth2UserService customOAuth2UserService;

    @Test
    void testGoogleAuthorizationRedirect() throws Exception {
        // Test that the Google authorization endpoint redirects properly
        mockMvc.perform(get("/api/oauth2/authorize/google")
                        .param("redirect_uri", "http://localhost:3000/oauth2/redirect"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("https://accounts.google.com/o/oauth2/auth?*"));
    }

    @Test
    void testGoogleAuthorizationWithMissingRedirectUri() throws Exception {
        // Test that missing redirect_uri parameter results in bad request
        mockMvc.perform(get("/api/oauth2/authorize/google"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testInvalidOAuth2Provider() throws Exception {
        // Test that requesting an invalid OAuth2 provider returns 404
        mockMvc.perform(get("/api/oauth2/authorize/facebook")
                        .param("redirect_uri", "http://localhost:3000/oauth2/redirect"))
                .andExpect(status().isNotFound());
    }
}
