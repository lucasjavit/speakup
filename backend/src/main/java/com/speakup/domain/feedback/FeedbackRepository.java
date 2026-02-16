package com.speakup.domain.feedback;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Feedback domain entity.
 */
public interface FeedbackRepository {

    /**
     * Save a feedback
     */
    Feedback save(Feedback feedback);

    /**
     * Find feedback by ID
     */
    Optional<Feedback> findById(UUID id);

    /**
     * Find all feedbacks with pagination
     */
    Page<Feedback> findAll(Pageable pageable);

    /**
     * Find feedbacks by status with pagination
     */
    Page<Feedback> findByStatus(FeedbackStatus status, Pageable pageable);

    /**
     * Find feedbacks by type with pagination
     */
    Page<Feedback> findByType(FeedbackType type, Pageable pageable);

    /**
     * Find feedbacks by status and type with pagination
     */
    Page<Feedback> findByStatusAndType(FeedbackStatus status, FeedbackType type, Pageable pageable);

    /**
     * Find feedbacks by user ID with pagination
     */
    Page<Feedback> findByUserId(UUID userId, Pageable pageable);

    /**
     * Count feedbacks by status
     */
    long countByStatus(FeedbackStatus status);

    /**
     * Count feedbacks by type
     */
    long countByType(FeedbackType type);

    /**
     * Count total feedbacks
     */
    long count();

    /**
     * Delete feedback by ID
     */
    void deleteById(UUID id);
}
