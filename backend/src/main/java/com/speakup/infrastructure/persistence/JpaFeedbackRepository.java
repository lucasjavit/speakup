package com.speakup.infrastructure.persistence;

import com.speakup.domain.feedback.Feedback;
import com.speakup.domain.feedback.FeedbackRepository;
import com.speakup.domain.feedback.FeedbackStatus;
import com.speakup.domain.feedback.FeedbackType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * JPA implementation of FeedbackRepository.
 * Spring Data provides the implementation automatically.
 */
@Repository
public interface JpaFeedbackRepository extends JpaRepository<Feedback, UUID>, FeedbackRepository {

    @Override
    Page<Feedback> findByStatus(FeedbackStatus status, Pageable pageable);

    @Override
    Page<Feedback> findByType(FeedbackType type, Pageable pageable);

    @Override
    @Query("SELECT f FROM Feedback f WHERE f.status = :status AND f.type = :type")
    Page<Feedback> findByStatusAndType(
            @Param("status") FeedbackStatus status,
            @Param("type") FeedbackType type,
            Pageable pageable
    );

    @Override
    @Query("SELECT f FROM Feedback f WHERE f.user.id = :userId")
    Page<Feedback> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Override
    long countByStatus(FeedbackStatus status);

    @Override
    long countByType(FeedbackType type);
}
