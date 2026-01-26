package com.speakup.application.topic.dto;

/**
 * Response DTO for conversation topics.
 */
public record TopicResponse(String topic) {

    public static TopicResponse of(String topic) {
        return new TopicResponse(topic);
    }
}
