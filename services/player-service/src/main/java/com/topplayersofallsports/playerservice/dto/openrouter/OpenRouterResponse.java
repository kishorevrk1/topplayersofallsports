package com.topplayersofallsports.playerservice.dto.openrouter;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenRouterResponse {
    
    private String id;
    private List<Choice> choices;
    private Usage usage;
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Choice {
        private Message message;
        private String finishReason;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Message {
        private String role;
        private String content;
    }
    
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Usage {
        private Integer promptTokens;
        private Integer completionTokens;
        private Integer totalTokens;
    }
}
