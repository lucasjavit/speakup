package com.speakup.application.conversation;

import com.speakup.application.conversation.dto.ConversationResponse;
import com.speakup.application.conversation.dto.UserStats;
import com.speakup.application.credit.CreditService;
import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing conversations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final CreditService creditService;

    /**
     * Get a conversation by ID.
     */
    @Transactional(readOnly = true)
    public Optional<ConversationResponse> getConversation(UUID conversationId) {
        return conversationRepository.findById(conversationId)
                .map(ConversationResponse::from);
    }

    /**
     * Get all conversations for a user.
     */
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getUserConversations(UUID userId, Pageable pageable) {
        return conversationRepository.findByUserId(userId, pageable)
                .map(ConversationResponse::from);
    }

    /**
     * Get user statistics.
     */
    @Transactional(readOnly = true)
    public UserStats getUserStats(UUID userId) {
        long totalConversations = conversationRepository.countCompletedByUserId(userId);
        long totalDurationSeconds = conversationRepository.getTotalDurationByUserId(userId);

        // Calculate date boundaries
        Instant oneWeekAgo = Instant.now().minus(java.time.Duration.ofDays(7));
        Instant startOfMonth = ZonedDateTime.now(ZoneId.systemDefault())
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0)
                .toInstant();

        long conversationsThisWeek = conversationRepository.countCompletedByUserIdSince(userId, oneWeekAgo);
        long conversationsThisMonth = conversationRepository.countCompletedByUserIdSince(userId, startOfMonth);

        return UserStats.builder()
                .totalConversations(totalConversations)
                .totalDurationSeconds(totalDurationSeconds)
                .totalDurationMinutes(totalDurationSeconds / 60)
                .averageDurationSeconds(totalConversations > 0
                        ? totalDurationSeconds / totalConversations
                        : 0)
                .conversationsThisWeek(conversationsThisWeek)
                .conversationsThisMonth(conversationsThisMonth)
                .build();
    }

    /**
     * Start a conversation (mark as active).
     */
    @Transactional
    public void startConversation(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        conversation.start();
        conversationRepository.save(conversation);
        log.info("Conversation {} started", conversationId);
    }

    private static final int MIN_DURATION_FOR_CREDIT_CONSUMPTION = 120; // 2 minutes in seconds

    /**
     * End a conversation.
     * Credits are consumed only if the conversation lasted at least 2 minutes.
     * This prevents charging for failed or very short calls.
     */
    @Transactional
    public void endConversation(UUID conversationId, UUID userId, boolean completed) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        // Verify user is part of this conversation
        if (!conversation.getUserA().getId().equals(userId) &&
            !conversation.getUserB().getId().equals(userId)) {
            throw new IllegalArgumentException("User is not part of this conversation");
        }

        if (completed) {
            conversation.complete();

            // Only consume credits if conversation lasted at least 2 minutes
            Integer duration = conversation.getDurationSeconds();
            if (duration != null && duration >= MIN_DURATION_FOR_CREDIT_CONSUMPTION) {
                creditService.consumeConversation(
                        conversation.getUserA().getId(),
                        conversationId.toString()
                );
                creditService.consumeConversation(
                        conversation.getUserB().getId(),
                        conversationId.toString()
                );
                log.info("Conversation {} completed with duration {}s - credits consumed",
                        conversationId, duration);
            } else {
                log.info("Conversation {} completed with duration {}s - too short, no credits consumed",
                        conversationId, duration);
            }
        } else {
            conversation.cancel();
        }

        conversationRepository.save(conversation);
        log.info("Conversation {} ended by user {}. Completed: {}", conversationId, userId, completed);
    }

    /**
     * Save recording URL for a user.
     */
    @Transactional
    public void saveRecording(UUID conversationId, UUID userId, String recordingUrl) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        if (conversation.getUserA().getId().equals(userId)) {
            conversation.setRecordingA(recordingUrl);
        } else if (conversation.getUserB().getId().equals(userId)) {
            conversation.setRecordingB(recordingUrl);
        } else {
            throw new IllegalArgumentException("User is not part of this conversation");
        }

        conversationRepository.save(conversation);
        log.info("Recording saved for conversation {} by user {}", conversationId, userId);
    }

    /**
     * Get active conversation for a user.
     */
    @Transactional(readOnly = true)
    public Optional<ConversationResponse> getActiveConversation(UUID userId) {
        return conversationRepository.findActiveByUserId(userId)
                .map(ConversationResponse::from);
    }
}
