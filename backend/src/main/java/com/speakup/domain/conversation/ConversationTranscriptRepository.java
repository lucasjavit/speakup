package com.speakup.domain.conversation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for ConversationTranscript entity.
 */
public interface ConversationTranscriptRepository {

    ConversationTranscript save(ConversationTranscript transcript);

    Optional<ConversationTranscript> findById(UUID id);

    /**
     * Find all transcripts requested by a user.
     */
    Page<ConversationTranscript> findByRequesterId(UUID requesterId, Pageable pageable);

    /**
     * Find transcript by conversation ID.
     */
    Optional<ConversationTranscript> findByConversationId(UUID conversationId);

    /**
     * Count transcripts requested by a user after a given timestamp.
     */
    long countByRequesterIdAndCreatedAtAfter(UUID requesterId, Instant after);

    /**
     * Find transcripts visible in history (all statuses: NOT_REQUESTED, PENDING, COMPLETED, FAILED).
     * Includes PENDING so the user sees "Analysis in progress" after refresh.
     */
    Page<ConversationTranscript> findVisibleByRequesterId(UUID requesterId, Pageable pageable);

    void flush();

    void delete(ConversationTranscript transcript);
}
