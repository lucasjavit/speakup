package com.speakup.application.conversation;

import com.speakup.application.conversation.dto.ConversationResponse;
import com.speakup.application.conversation.dto.UserStats;
import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        return UserStats.builder()
                .totalConversations(totalConversations)
                .totalDurationSeconds(totalDurationSeconds)
                .totalDurationMinutes(totalDurationSeconds / 60)
                .averageDurationSeconds(totalConversations > 0
                        ? totalDurationSeconds / totalConversations
                        : 0)
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

    /**
     * End a conversation.
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
