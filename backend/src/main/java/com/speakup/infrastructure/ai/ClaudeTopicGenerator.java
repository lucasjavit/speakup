package com.speakup.infrastructure.ai;

import com.speakup.application.matching.TopicGeneratorStrategy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

/**
 * Claude-based implementation of TopicGeneratorStrategy.
 * Uses Claude AI to generate conversation topics with fallback to static topics.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "speakup.topics.provider", havingValue = "claude")
public class ClaudeTopicGenerator implements TopicGeneratorStrategy {

    private final ClaudeClient claudeClient;
    private final Random random = new Random();

    // Fallback topics in case Claude API fails
    private static final List<String> FALLBACK_TOPICS = List.of(
            "If you could travel anywhere in the world, where would you go and why?",
            "What's the most interesting place you've ever visited?",
            "What would you do if you won the lottery?",
            "How has technology changed your daily life?",
            "What's the last movie or series you watched?",
            "Where do you see yourself in five years?",
            "What's your favorite cuisine and why?",
            "What qualities do you value most in a friend?",
            "Do you prefer living in a city or in the countryside?",
            "What motivates you to keep learning new things?"
    );

    public ClaudeTopicGenerator(ClaudeClient claudeClient) {
        this.claudeClient = claudeClient;
        log.info("Claude topic generator initialized");
    }

    @Override
    public String generateTopic() {
        try {
            String topic = claudeClient.generateTopic();
            if (topic != null && !topic.isBlank()) {
                log.debug("Generated topic using Claude AI");
                return topic;
            }
        } catch (Exception e) {
            log.warn("Failed to generate topic with Claude, using fallback: {}", e.getMessage());
        }

        return getFallbackTopic();
    }

    @Override
    public String generateTopic(String category) {
        try {
            String topic = claudeClient.generateTopic(category);
            if (topic != null && !topic.isBlank()) {
                log.debug("Generated topic for category '{}' using Claude AI", category);
                return topic;
            }
        } catch (Exception e) {
            log.warn("Failed to generate topic for category '{}' with Claude, using fallback: {}",
                    category, e.getMessage());
        }

        return getFallbackTopic();
    }

    private String getFallbackTopic() {
        int index = random.nextInt(FALLBACK_TOPICS.size());
        log.debug("Using fallback topic");
        return FALLBACK_TOPICS.get(index);
    }
}
