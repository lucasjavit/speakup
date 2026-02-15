package com.speakup.domain.conversation;

/**
 * Status of the AI analysis for a conversation transcript.
 */
public enum AnalysisStatus {
    /**
     * Analysis not requested by the user.
     */
    NOT_REQUESTED,
    
    /**
     * Analysis requested and waiting to be processed.
     */
    PENDING,
    
    /**
     * Analysis completed successfully.
     */
    COMPLETED,
    
    /**
     * Analysis failed due to an error.
     */
    FAILED
}
