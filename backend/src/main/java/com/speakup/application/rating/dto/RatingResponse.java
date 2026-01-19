package com.speakup.application.rating.dto;

import com.speakup.domain.rating.Rating;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for rating data.
 */
@Builder
public record RatingResponse(
        UUID id,
        UUID conversationId,
        UUID raterId,
        UUID ratedUserId,
        Integer stars,
        boolean wantToTalkAgain,
        String partnerFluencyLevel,
        boolean mutualInterest,
        Instant createdAt
) {

    public static RatingResponse from(Rating rating, boolean mutualInterest) {
        return RatingResponse.builder()
                .id(rating.getId())
                .conversationId(rating.getConversation().getId())
                .raterId(rating.getRater().getId())
                .ratedUserId(rating.getRatedUser().getId())
                .stars(rating.getStars())
                .wantToTalkAgain(rating.isWantToTalkAgain())
                .partnerFluencyLevel(rating.getPartnerFluencyLevel() != null
                        ? rating.getPartnerFluencyLevel().name() : null)
                .mutualInterest(mutualInterest)
                .createdAt(rating.getCreatedAt())
                .build();
    }

    public static RatingResponse from(Rating rating) {
        return from(rating, false);
    }
}
