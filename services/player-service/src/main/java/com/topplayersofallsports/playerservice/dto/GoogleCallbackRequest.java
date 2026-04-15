package com.topplayersofallsports.playerservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleCallbackRequest {

    @NotBlank(message = "Google auth code is required")
    private String code;

    @NotBlank(message = "Redirect URI is required")
    private String redirectUri;
}
