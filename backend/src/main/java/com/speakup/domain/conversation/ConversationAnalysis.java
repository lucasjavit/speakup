package com.speakup.domain.conversation;

import com.speakup.domain.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * AI-generated analysis of a conversation transcript.
 * Contains grammar corrections, vocabulary suggestions, fluency analysis, and more.
 */
@Entity
@Table(name = "conversation_analyses", indexes = {
    @Index(name = "idx_analysis_transcript", columnList = "transcript_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationAnalysis extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transcript_id", nullable = false, unique = true)
    private ConversationTranscript transcript;

    @Column(name = "grammar_corrections", columnDefinition = "TEXT")
    private String grammarCorrections; // JSON array

    @Column(name = "vocabulary_suggestions", columnDefinition = "TEXT")
    private String vocabularySuggestions; // JSON array

    @Column(name = "fluency_analysis", columnDefinition = "TEXT")
    private String fluencyAnalysis; // JSON object

    @Column(name = "estimated_level", length = 10)
    private String estimatedLevel; // A1, A2, B1, B2, C1, C2

    @Column(name = "natural_phrases", columnDefinition = "TEXT")
    private String naturalPhrases; // JSON array

    @Column(name = "topics_practiced", columnDefinition = "TEXT")
    private String topicsPracticed; // JSON array

    @Column(name = "overall_feedback", columnDefinition = "TEXT")
    private String overallFeedback;

    @Column(name = "tokens_used")
    private Integer tokensUsed;
}
