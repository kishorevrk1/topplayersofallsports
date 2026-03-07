package com.topplayersofallsports.playerservice.dto;

import lombok.Data;

@Data
public class GoogleCallbackRequest {
    private String code;
    private String redirectUri;
}
