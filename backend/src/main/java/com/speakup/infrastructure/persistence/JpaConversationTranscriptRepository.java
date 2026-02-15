package com.speakup.infrastructure.persistence;

import com.speakup.domain.conversation.AnalysisStatus;
import com.speakup.domain.conversation.ConversationTranscript;
import com.speakup.domain.conversation.ConversationTranscriptRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of ConversationTranscriptRepository.
 */
@Repository
public interface JpaConversationTranscriptRepository extends JpaRepository<ConversationTranscript, UUID>, ConversationTranscriptRepository {

    @Override
    @Query("SELECT ct FROM ConversationTranscript ct WHERE ct.requester.id = :requesterId ORDER BY ct.createdAt DESC")
    Page<ConversationTranscript> findByRequesterId(@Param("requesterId") UUID requesterId, Pageable pageable);

    @Override
    @Query("SELECT ct FROM ConversationTranscript ct WHERE ct.conversation.id = :conversationId")
    Optional<ConversationTranscript> findByConversationId(@Param("conversationId") UUID conversationId);

    @Override
    @Query("""
        SELECT COUNT(ct) FROM ConversationTranscript ct
        WHERE ct.requester.id = :requesterId
        AND ct.createdAt > :after
        """)
    long countByRequesterIdAndCreatedAtAfter(@Param("requesterId") UUID requesterId, @Param("after") Instant after);

    @Override
    @Query("""
        SELECT ct FROM ConversationTranscript ct
        WHERE ct.requester.id = :requesterId
        ORDER BY ct.createdAt DESC
        """)
    Page<ConversationTranscript> findVisibleByRequesterId(@Param("requesterId") UUID requesterId, Pageable pageable);
}
