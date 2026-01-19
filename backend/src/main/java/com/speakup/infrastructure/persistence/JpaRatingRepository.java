package com.speakup.infrastructure.persistence;

import com.speakup.domain.rating.Rating;
import com.speakup.domain.rating.RatingRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of RatingRepository.
 */
@Repository
public interface JpaRatingRepository extends JpaRepository<Rating, UUID>, RatingRepository {

    @Override
    @Query("SELECT r FROM Rating r WHERE r.conversation.id = :conversationId AND r.rater.id = :raterId")
    Optional<Rating> findByConversationIdAndRaterId(
            @Param("conversationId") UUID conversationId,
            @Param("raterId") UUID raterId);

    @Override
    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM Rating r
        WHERE r.conversation.id = :conversationId AND r.rater.id = :raterId
        """)
    boolean existsByConversationIdAndRaterId(
            @Param("conversationId") UUID conversationId,
            @Param("raterId") UUID raterId);

    @Override
    @Query("SELECT r FROM Rating r WHERE r.ratedUser.id = :ratedUserId ORDER BY r.createdAt DESC")
    List<Rating> findByRatedUserId(@Param("ratedUserId") UUID ratedUserId);

    @Override
    @Query("SELECT r FROM Rating r WHERE r.rater.id = :raterId ORDER BY r.createdAt DESC")
    List<Rating> findByRaterId(@Param("raterId") UUID raterId);

    @Override
    @Query("SELECT AVG(r.stars) FROM Rating r WHERE r.ratedUser.id = :ratedUserId")
    Double getAverageRatingByRatedUserId(@Param("ratedUserId") UUID ratedUserId);

    @Override
    @Query("SELECT COUNT(r) FROM Rating r WHERE r.ratedUser.id = :ratedUserId")
    long countByRatedUserId(@Param("ratedUserId") UUID ratedUserId);
}
