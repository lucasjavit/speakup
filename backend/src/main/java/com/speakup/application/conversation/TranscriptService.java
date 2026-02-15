package com.speakup.application.conversation;

import com.speakup.application.conversation.dto.*;
import com.speakup.domain.conversation.*;
import com.speakup.domain.settings.ApplicationSettingRepository;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Service for managing conversation transcripts.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TranscriptService {

    private static final String DAILY_TRANSCRIPT_LIMIT_KEY = "transcript.daily_limit";
    private static final int DEFAULT_DAILY_TRANSCRIPT_LIMIT = 2;
    private static final Duration DAILY_RESET_PERIOD = Duration.ofHours(24);

    private final ConversationTranscriptRepository transcriptRepository;
    private final ConversationAnalysisRepository analysisRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final ApplicationSettingRepository settingRepository;
    private final TranscriptAnalysisProcessor analysisProcessor;

    /**
     * Save a conversation transcript.
     */
    @Transactional
    public TranscriptDTO saveTranscript(UUID conversationId, UUID userId, String transcriptData, boolean includeAnalysis) {
        log.info(">>> saveTranscript START - conversation={}, user={}, dataLength={}", conversationId, userId, transcriptData != null ? transcriptData.length() : 0);

        // Validate quota
        if (!canRequestTranscript(userId)) {
            int limit = getDailyLimit();
            throw new IllegalStateException("Daily transcript limit reached. You can request " + limit + " transcripts per day.");
        }
        log.info(">>> quota check passed");

        // Get conversation
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));
        log.info(">>> conversation found, status={}", conversation.getStatus());

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        log.info(">>> user found: {}", user.getEmail());
        
        log.info("User {} has API key configured: {}", userId, (user.getOpenaiApiKey() != null && !user.getOpenaiApiKey().isBlank()));

        // Verify user is part of the conversation
        if (!conversation.involvesUser(user)) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }
        log.info(">>> user is participant, building transcript entity");

        // Create transcript (analysis is triggered manually from Conversations page)
        ConversationTranscript transcript = ConversationTranscript.builder()
                .conversation(conversation)
                .requester(user)
                .transcriptData(transcriptData)
                .includeAnalysis(false)
                .analysisStatus(AnalysisStatus.NOT_REQUESTED)
                .build();

        log.info(">>> saving transcript to DB...");
        transcript = transcriptRepository.save(transcript);
        log.info(">>> transcript saved with id={}", transcript.getId());

        // Increment user's daily counter
        incrementTranscriptCounter(user);
        log.info(">>> counter incremented, building DTO");

        TranscriptDTO dto = TranscriptDTO.from(transcript);
        log.info(">>> saveTranscript DONE - id={}", dto.id());
        return dto;
    }

    /**
     * Check if a user can request a new transcript.
     */
    @Transactional(readOnly = true)
    public boolean canRequestTranscript(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Reset counter if needed
        if (shouldResetCounter(user)) {
            log.info("User {} transcript counter needs reset", userId);
            return true;
        }

        Integer transcriptsToday = user.getTranscriptsToday() != null ? user.getTranscriptsToday() : 0;
        int dailyLimit = getDailyLimit();
        boolean canRequest = transcriptsToday < dailyLimit;
        
        log.info("User {} transcript check: used={}, limit={}, canRequest={}", 
                userId, transcriptsToday, dailyLimit, canRequest);
        
        return canRequest;
    }

    /**
     * Get the daily transcript limit from settings.
     */
    private int getDailyLimit() {
        int limit = settingRepository.findByKey(DAILY_TRANSCRIPT_LIMIT_KEY)
                .map(setting -> {
                    try {
                        int value = Integer.parseInt(setting.getValue());
                        log.debug("Daily transcript limit from database: {}", value);
                        return value;
                    } catch (NumberFormatException e) {
                        log.warn("Invalid transcript limit value: {}, using default", setting.getValue());
                        return DEFAULT_DAILY_TRANSCRIPT_LIMIT;
                    }
                })
                .orElseGet(() -> {
                    log.warn("Transcript limit setting not found, using default: {}", DEFAULT_DAILY_TRANSCRIPT_LIMIT);
                    return DEFAULT_DAILY_TRANSCRIPT_LIMIT;
                });
        
        log.info("Current daily transcript limit: {}", limit);
        return limit;
    }

    /**
     * Get transcript quota information for a user.
     */
    @Transactional(readOnly = true)
    public TranscriptQuotaDTO getQuota(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        int dailyLimit = getDailyLimit();

        // Reset counter if needed
        if (shouldResetCounter(user)) {
            return TranscriptQuotaDTO.builder()
                    .available(dailyLimit)
                    .limit(dailyLimit)
                    .resetsAt(Instant.now().plus(DAILY_RESET_PERIOD))
                    .build();
        }

        Integer transcriptsToday = user.getTranscriptsToday() != null ? user.getTranscriptsToday() : 0;
        int available = Math.max(0, dailyLimit - transcriptsToday);
        Instant resetsAt = user.getTranscriptsDayResetAt() != null
                ? user.getTranscriptsDayResetAt().plus(DAILY_RESET_PERIOD)
                : Instant.now().plus(DAILY_RESET_PERIOD);

        return TranscriptQuotaDTO.builder()
                .available(available)
                .limit(dailyLimit)
                .resetsAt(resetsAt)
                .build();
    }

    /**
     * Get all transcripts for a user (paginated).
     */
    @Transactional(readOnly = true)
    public Page<TranscriptSummaryDTO> getUserTranscripts(UUID userId, Pageable pageable) {
        return transcriptRepository.findVisibleByRequesterId(userId, pageable)
                .map(TranscriptSummaryDTO::from);
    }

    /**
     * Get transcript details with analysis.
     */
    @Transactional(readOnly = true)
    public TranscriptWithAnalysisDTO getTranscriptDetails(UUID transcriptId, UUID userId) {
        ConversationTranscript transcript = transcriptRepository.findById(transcriptId)
                .orElseThrow(() -> new IllegalArgumentException("Transcript not found: " + transcriptId));

        // Verify user is the requester
        if (!transcript.getRequester().getId().equals(userId)) {
            throw new IllegalArgumentException("User is not authorized to view this transcript");
        }

        // Get analysis if it exists
        ConversationAnalysis analysis = analysisRepository.findByTranscriptId(transcriptId).orElse(null);

        return TranscriptWithAnalysisDTO.from(transcript, analysis);
    }

    /**
     * Request AI analysis for an existing transcript.
     */
    @Transactional
    public TranscriptDTO requestAnalysis(UUID transcriptId, UUID userId) {
        ConversationTranscript transcript = transcriptRepository.findById(transcriptId)
                .orElseThrow(() -> new IllegalArgumentException("Transcript not found: " + transcriptId));

        if (!transcript.getRequester().getId().equals(userId)) {
            throw new IllegalArgumentException("User is not authorized to analyze this transcript");
        }

        if (transcript.getAnalysisStatus() == AnalysisStatus.COMPLETED) {
            throw new IllegalStateException("Analysis already completed for this transcript");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (user.getOpenaiApiKey() == null || user.getOpenaiApiKey().isBlank()) {
            throw new IllegalStateException("OpenAI API key not configured. Go to Settings to add your key.");
        }

        // Mark as pending and flush so list views see PENDING immediately after refresh
        transcript.setIncludeAnalysis(true);
        transcript.setAnalysisStatus(AnalysisStatus.PENDING);
        transcript.setErrorMessage(null);
        transcriptRepository.save(transcript);
        transcriptRepository.flush();

        log.info("✅ Requesting AI analysis for transcript {}", transcriptId);
        analysisProcessor.processAnalysis(transcriptId, user.getOpenaiApiKey());

        return TranscriptDTO.from(transcript);
    }

    private boolean shouldResetCounter(User user) {
        Instant resetAt = user.getTranscriptsDayResetAt();
        if (resetAt == null) {
            return true;
        }
        return Instant.now().isAfter(resetAt.plus(DAILY_RESET_PERIOD));
    }

    @Transactional
    private void incrementTranscriptCounter(User user) {
        if (shouldResetCounter(user)) {
            user.setTranscriptsToday(1);
            user.setTranscriptsDayResetAt(Instant.now());
        } else {
            Integer current = user.getTranscriptsToday() != null ? user.getTranscriptsToday() : 0;
            user.setTranscriptsToday(current + 1);
        }
        userRepository.save(user);
    }
}
