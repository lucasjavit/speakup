package com.speakup.application.topic;

import com.speakup.application.matching.TopicGeneratorStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Service for managing conversation topics.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TopicService {

    private final TopicGeneratorStrategy topicGenerator;

    /**
     * Get a random conversation topic.
     * Not cached - generates fresh topic for each session.
     */
    public String getRandomTopic() {
        String topic = topicGenerator.generateTopic();
        log.debug("Generated random topic: {}", topic);
        return topic;
    }

    /**
     * Get a topic for a specific category.
     */
    @Cacheable(value = "categoryTopic", key = "#category", unless = "#result == null")
    public String getTopicByCategory(String category) {
        String topic = topicGenerator.generateTopic(category);
        log.debug("Generated topic for category '{}': {}", category, topic);
        return topic;
    }
}
