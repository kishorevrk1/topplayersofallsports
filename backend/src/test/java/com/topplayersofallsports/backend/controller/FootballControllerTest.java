package com.topplayersofallsports.backend.controller;

import com.topplayersofallsports.backend.service.FootballDataService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Basic test for FootballController
 */
@WebMvcTest(FootballController.class)
public class FootballControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FootballDataService footballDataService;

    @Test
    public void testGetTodaysFixtures() throws Exception {
        // Mock the service
        when(footballDataService.getTodaysFixtures()).thenReturn(new ArrayList<>());

        // Test the endpoint
        mockMvc.perform(get("/api/football/fixtures/today"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    public void testApiUsageStats() throws Exception {
        // Mock the service
        FootballDataService.ApiUsageStats mockStats = FootballDataService.ApiUsageStats.builder()
                .totalCachedFixtures(0L)
                .build();
        when(footballDataService.getApiUsageStats()).thenReturn(mockStats);

        // Test the endpoint
        mockMvc.perform(get("/api/football/stats/usage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
