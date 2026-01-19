package com.speakup.domain.rating;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Rating entity.
 */
public interface RatingRepository {

    Rating save(Rating rating);

    Optional<Rating> findById(UUID id);

    /**
     * Find rating by conversation and rater.
     */
    Optional<Rating> findByConversationIdAndRaterId(UUID conversationId, UUID raterId);

    /**
     * Check if a user has already rated a conversation.
     */
    boolean existsByConversationIdAndRaterId(UUID conversationId, UUID raterId);

    /**
     * Find all ratings received by a user.
     */
    List<Rating> findByRatedUserId(UUID ratedUserId);

    /**
     * Find all ratings given by a user.
     */
    List<Rating> findByRaterId(UUID raterId);

    /**
     * Get average rating for a user.
     */
    Double getAverageRatingByRatedUserId(UUID ratedUserId);

    /**
     * Count total ratings received by a user.
     */
    long countByRatedUserId(UUID ratedUserId);

    void delete(Rating rating);
}
