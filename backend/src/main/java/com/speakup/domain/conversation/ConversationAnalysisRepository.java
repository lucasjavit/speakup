package com.speakup.domain.conversation;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for ConversationAnalysis entity.
 */
public interface ConversationAnalysisRepository {

    ConversationAnalysis save(ConversationAnalysis analysis);

    Optional<ConversationAnalysis> findById(UUID id);

    /**
     * Find analysis by transcript ID.
     */
    Optional<ConversationAnalysis> findByTranscriptId(UUID transcriptId);

    void delete(ConversationAnalysis analysis);
}
