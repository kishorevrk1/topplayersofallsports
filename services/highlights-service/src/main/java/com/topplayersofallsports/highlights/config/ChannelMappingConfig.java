package com.topplayersofallsports.highlights.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for YouTube channel ID mappings.
 * Loads from channel-mappings.yml
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "")
public class ChannelMappingConfig {
    
    private Map<String, String> channels = new HashMap<>();
    
    /**
     * Get channel ID for a source name.
     * @param sourceName The name of the highlight source
     * @return YouTube channel ID, or null if not found
     */
    public String getChannelId(String sourceName) {
        return channels.get(sourceName);
    }
    
    /**
     * Add or update a channel mapping.
     * @param sourceName The name of the highlight source
     * @param channelId The YouTube channel ID
     */
    public void addChannelMapping(String sourceName, String channelId) {
        channels.put(sourceName, channelId);
    }
    
    /**
     * Get all channel mappings.
     * @return Map of source names to channel IDs
     */
    public Map<String, String> getAllMappings() {
        return new HashMap<>(channels);
    }
}
