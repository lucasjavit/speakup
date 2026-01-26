package com.speakup.presentation.api;

import com.speakup.application.topic.TopicService;
import com.speakup.application.topic.dto.TopicResponse;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public controller for conversation topics.
 * No authentication required - used for landing page.
 */
@RestController
@RequestMapping("/api/v1/public/topics")
@RequiredArgsConstructor
@Tag(name = "Topics", description = "Public conversation topic endpoints")
public class TopicController {

    private final TopicService topicService;

    @GetMapping("/random")
    @Operation(
        summary = "Get random conversation topic",
        description = "Returns a random conversation topic for display on landing page. " +
                     "Uses AI generation with fallback topics. Cached for performance."
    )
    public ResponseEntity<ApiResponse<TopicResponse>> getRandomTopic() {
        String topic = topicService.getRandomTopic();
        return ResponseEntity.ok(ApiResponse.success(TopicResponse.of(topic)));
    }
}
