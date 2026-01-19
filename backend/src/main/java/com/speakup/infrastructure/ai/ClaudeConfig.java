package com.speakup.infrastructure.ai;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for Claude API integration.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "claude.api")
public class ClaudeConfig {

    /**
     * Claude API key.
     */
    private String key;

    /**
     * Claude API URL (default: https://api.anthropic.com/v1/messages).
     */
    private String url = "https://api.anthropic.com/v1/messages";

    /**
     * Claude model to use (default: claude-3-haiku-20240307).
     */
    private String model = "claude-3-haiku-20240307";

    /**
     * Maximum tokens for the response.
     */
    private int maxTokens = 100;

    /**
     * Check if Claude API is configured and enabled.
     */
    public boolean isEnabled() {
        return key != null && !key.isBlank();
    }
}
