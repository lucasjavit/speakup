package com.speakup.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * HTTP client for interacting with the Claude API.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "speakup.topics.provider", havingValue = "claude")
public class ClaudeClient {

    private static final String ANTHROPIC_VERSION = "2023-06-01";
    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    private final WebClient webClient;
    private final ClaudeConfig config;
    private final ObjectMapper objectMapper;

    public ClaudeClient(ClaudeConfig config, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;
        this.webClient = WebClient.builder()
                .baseUrl(config.getUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("x-api-key", config.getKey())
                .defaultHeader("anthropic-version", ANTHROPIC_VERSION)
                .build();
    }

    /**
     * Generate a conversation topic using Claude.
     *
     * @return A topic question for conversation practice
     */
    public String generateTopic() {
        String systemPrompt = """
                You are a helpful assistant that generates conversation topics for English language practice.
                Generate engaging, open-ended questions that are:
                - Suitable for intermediate English learners
                - About everyday life, culture, travel, technology, or hypothetical situations
                - Easy to discuss for 5-10 minutes

                Return ONLY the topic question, nothing else. No quotes, no explanation.
                """;

        String userPrompt = "Generate a single conversation topic question for English practice.";

        return callClaude(systemPrompt, userPrompt);
    }

    /**
     * Generate a topic for a specific category.
     *
     * @param category The topic category
     * @return A topic question for conversation practice
     */
    public String generateTopic(String category) {
        String systemPrompt = """
                You are a helpful assistant that generates conversation topics for English language practice.
                Generate engaging, open-ended questions that are:
                - Suitable for intermediate English learners
                - Related to the specified category
                - Easy to discuss for 5-10 minutes

                Return ONLY the topic question, nothing else. No quotes, no explanation.
                """;

        String userPrompt = "Generate a single conversation topic question about: " + category;

        return callClaude(systemPrompt, userPrompt);
    }

    private String callClaude(String systemPrompt, String userPrompt) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "model", config.getModel(),
                    "max_tokens", config.getMaxTokens(),
                    "system", systemPrompt,
                    "messages", List.of(
                            Map.of("role", "user", "content", userPrompt)
                    )
            );

            String response = webClient.post()
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .onErrorResume(e -> {
                        log.error("Claude API error: {}", e.getMessage());
                        return Mono.empty();
                    })
                    .block();

            if (response == null) {
                log.warn("Claude API returned null response");
                return null;
            }

            // Parse the response to extract the topic
            JsonNode root = objectMapper.readTree(response);
            JsonNode content = root.path("content");
            if (content.isArray() && !content.isEmpty()) {
                String topic = content.get(0).path("text").asText();
                log.debug("Generated topic from Claude: {}", topic);
                return topic.trim();
            }

            log.warn("Unexpected Claude API response format");
            return null;

        } catch (Exception e) {
            log.error("Failed to call Claude API: {}", e.getMessage(), e);
            return null;
        }
    }
}
