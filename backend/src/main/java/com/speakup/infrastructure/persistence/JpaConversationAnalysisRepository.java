package com.speakup.infrastructure.persistence;

import com.speakup.domain.conversation.ConversationAnalysis;
import com.speakup.domain.conversation.ConversationAnalysisRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of ConversationAnalysisRepository.
 */
@Repository
public interface JpaConversationAnalysisRepository extends JpaRepository<ConversationAnalysis, UUID>, ConversationAnalysisRepository {

    @Override
    @Query("SELECT ca FROM ConversationAnalysis ca WHERE ca.transcript.id = :transcriptId")
    Optional<ConversationAnalysis> findByTranscriptId(@Param("transcriptId") UUID transcriptId);
}
