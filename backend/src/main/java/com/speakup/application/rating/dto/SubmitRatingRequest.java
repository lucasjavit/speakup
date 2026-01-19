package com.speakup.application.rating.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request to submit a rating after a conversation.
 */
public record SubmitRatingRequest(
        @NotNull(message = "Conversation ID is required")
        UUID conversationId,

        @NotNull(message = "Stars rating is required")
        @Min(value = 1, message = "Rating must be at least 1 star")
        @Max(value = 5, message = "Rating must be at most 5 stars")
        Integer stars,

        boolean wantToTalkAgain,

        String partnerFluencyLevel  // optional: "BASIC", "ELEMENTARY", "LEVEL_UP", "EXPERT"
) {
}
