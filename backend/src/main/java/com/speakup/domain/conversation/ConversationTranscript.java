package com.speakup.domain.conversation;

import com.speakup.domain.shared.BaseEntity;
import com.speakup.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a transcript of a conversation between two users.
 * Contains the full text transcript in JSON format with timestamps.
 */
@Entity
@Table(name = "conversation_transcripts", indexes = {
    @Index(name = "idx_transcript_conversation", columnList = "conversation_id"),
    @Index(name = "idx_transcript_requester", columnList = "requester_id"),
    @Index(name = "idx_transcript_status", columnList = "analysis_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationTranscript extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(name = "transcript_data", columnDefinition = "TEXT", nullable = false)
    private String transcriptData; // JSON array: [{speaker: "User A", text: "...", timestamp: ...}]

    @Column(name = "include_analysis", nullable = false)
    @Builder.Default
    private boolean includeAnalysis = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_status", nullable = false)
    @Builder.Default
    private AnalysisStatus analysisStatus = AnalysisStatus.NOT_REQUESTED;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Mark analysis as pending.
     */
    public void markAnalysisPending() {
        this.analysisStatus = AnalysisStatus.PENDING;
    }

    /**
     * Mark analysis as completed.
     */
    public void markAnalysisCompleted() {
        this.analysisStatus = AnalysisStatus.COMPLETED;
        this.errorMessage = null;
    }

    /**
     * Mark analysis as failed with error message.
     */
    public void markAnalysisFailed(String errorMessage) {
        this.analysisStatus = AnalysisStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    /**
     * Check if analysis is completed.
     */
    public boolean isAnalysisCompleted() {
        return analysisStatus == AnalysisStatus.COMPLETED;
    }

    /**
     * Check if analysis should be shown (completed or not requested).
     */
    public boolean shouldShowInHistory() {
        return analysisStatus == AnalysisStatus.COMPLETED || analysisStatus == AnalysisStatus.NOT_REQUESTED;
    }
}
