package com.speakup.domain.conversation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Conversation entity.
 */
public interface ConversationRepository {

    Conversation save(Conversation conversation);

    Optional<Conversation> findById(UUID id);

    /**
     * Find all conversations for a user (as either userA or userB).
     */
    Page<Conversation> findByUserId(UUID userId, Pageable pageable);

    /**
     * Find conversations between two users in a specific session.
     */
    List<Conversation> findByUsersAndSession(UUID userAId, UUID userBId, UUID sessionId);

    /**
     * Check if two users have already had a conversation in the same session.
     */
    boolean existsByUsersAndSession(UUID userAId, UUID userBId, UUID sessionId);

    /**
     * Find active conversations for a user.
     */
    Optional<Conversation> findActiveByUserId(UUID userId);

    /**
     * Find conversations by session.
     */
    List<Conversation> findBySessionId(UUID sessionId);

    /**
     * Count completed conversations for a user.
     */
    long countCompletedByUserId(UUID userId);

    /**
     * Get total duration of all conversations for a user (in seconds).
     */
    long getTotalDurationByUserId(UUID userId);

    /**
     * Find conversations by status.
     */
    List<Conversation> findByStatus(ConversationStatus status);

    void delete(Conversation conversation);
}
