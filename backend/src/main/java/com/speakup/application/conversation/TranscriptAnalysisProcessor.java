package com.speakup.application.conversation;

import com.speakup.domain.conversation.ConversationAnalysis;
import com.speakup.domain.conversation.ConversationAnalysisRepository;
import com.speakup.domain.conversation.ConversationTranscript;
import com.speakup.domain.conversation.ConversationTranscriptRepository;
import com.speakup.infrastructure.ai.OpenAIAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Separate service for async transcript analysis processing.
 * Extracted from TranscriptService to avoid Spring @Async self-invocation issue.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TranscriptAnalysisProcessor {

    private final ConversationTranscriptRepository transcriptRepository;
    private final ConversationAnalysisRepository analysisRepository;
    private final OpenAIAnalysisService analysisService;

    @Async
    @Transactional
    public void processAnalysis(UUID transcriptId, String apiKey) {
        log.info("Processing analysis for transcript {} asynchronously", transcriptId);

        try {
            ConversationTranscript transcript = transcriptRepository.findById(transcriptId)
                    .orElseThrow(() -> new IllegalArgumentException("Transcript not found: " + transcriptId));

            // Call OpenAI API
            ConversationAnalysis analysis = analysisService.analyzeTranscript(transcript, apiKey);

            // Save analysis
            analysisRepository.save(analysis);

            // Update transcript status
            transcript.markAnalysisCompleted();
            transcriptRepository.save(transcript);

            log.info("Analysis for transcript {} completed successfully", transcriptId);
        } catch (Exception e) {
            log.error("Failed to process analysis for transcript {}", transcriptId, e);

            // Mark as failed
            ConversationTranscript transcript = transcriptRepository.findById(transcriptId).orElse(null);
            if (transcript != null) {
                transcript.markAnalysisFailed(e.getMessage());
                transcriptRepository.save(transcript);
            }
        }
    }
}
