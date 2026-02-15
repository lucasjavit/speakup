package com.speakup.application.conversation.dto;

import com.speakup.domain.conversation.ConversationAnalysis;
import lombok.Builder;

import java.util.UUID;

/**
 * DTO for conversation analysis data.
 */
@Builder
public record AnalysisDTO(
        UUID id,
        String grammarCorrections,
        String vocabularySuggestions,
        String fluencyAnalysis,
        String estimatedLevel,
        String naturalPhrases,
        String topicsPracticed,
        String overallFeedback,
        Integer tokensUsed
) {

    public static AnalysisDTO from(ConversationAnalysis analysis) {
        return AnalysisDTO.builder()
                .id(analysis.getId())
                .grammarCorrections(analysis.getGrammarCorrections())
                .vocabularySuggestions(analysis.getVocabularySuggestions())
                .fluencyAnalysis(analysis.getFluencyAnalysis())
                .estimatedLevel(analysis.getEstimatedLevel())
                .naturalPhrases(analysis.getNaturalPhrases())
                .topicsPracticed(analysis.getTopicsPracticed())
                .overallFeedback(analysis.getOverallFeedback())
                .tokensUsed(analysis.getTokensUsed())
                .build();
    }
}
