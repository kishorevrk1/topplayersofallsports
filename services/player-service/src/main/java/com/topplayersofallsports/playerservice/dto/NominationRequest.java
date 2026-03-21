package com.topplayersofallsports.playerservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NominationRequest {
    @NotBlank(message = "Sport is required")
    private String sport;

    @NotBlank(message = "Player name is required")
    private String playerName;

    private String reason;
}
