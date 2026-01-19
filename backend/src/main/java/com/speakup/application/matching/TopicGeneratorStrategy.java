package com.speakup.application.matching;

/**
 * Strategy interface for generating conversation topics.
 * Implementations can use static lists, AI generation, or other methods.
 */
public interface TopicGeneratorStrategy {

    /**
     * Generate a random conversation topic.
     *
     * @return A topic question for conversation practice
     */
    String generateTopic();

    /**
     * Generate a topic from a specific category.
     *
     * @param category The topic category (e.g., "travel", "technology")
     * @return A topic question for conversation practice
     */
    String generateTopic(String category);
}
