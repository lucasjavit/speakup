package com.speakup.application.matching;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Topic generator service that delegates to the configured strategy.
 * This class maintains backward compatibility while allowing different implementations.
 */
@Component
@RequiredArgsConstructor
public class TopicGenerator {

    private final TopicGeneratorStrategy strategy;

    /**
     * Generate a random conversation topic.
     *
     * @return A topic question for conversation practice
     */
    public String generateTopic() {
        return strategy.generateTopic();
    }

    /**
     * Generate a topic from a specific category.
     *
     * @param category The topic category (e.g., "travel", "technology")
     * @return A topic question for conversation practice
     */
    public String generateTopic(String category) {
        return strategy.generateTopic(category);
    }
}
