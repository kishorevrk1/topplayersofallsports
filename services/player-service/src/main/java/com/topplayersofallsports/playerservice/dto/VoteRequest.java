package com.topplayersofallsports.playerservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VoteRequest {
    @NotNull(message = "player1Id is required")
    private Long player1Id;

    @NotNull(message = "player2Id is required")
    private Long player2Id;

    @NotNull(message = "winnerId is required")
    private Long winnerId;
}
