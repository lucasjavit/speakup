package com.speakup.application.matching;

import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationRepository;
import com.speakup.domain.conversation.ConversationStatus;
import com.speakup.domain.matching.QueueEntry;
import com.speakup.domain.relationship.UserRelationshipRepository;
import com.speakup.domain.session.Session;
import com.speakup.domain.session.SessionRepository;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.infrastructure.redis.RedisQueueService;
import com.speakup.infrastructure.websocket.WebSocketSessionManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing user matching and queue operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {

    private final RedisQueueService queueService;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final UserRelationshipRepository relationshipRepository;
    private final WebSocketSessionManager webSocketSessionManager;
    private final TopicGenerator topicGenerator;

    /**
     * Add a user to the matching queue.
     */
    @Transactional
    public QueueEntry joinQueue(UUID userId, UUID sessionId) {
        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Validate session exists and is currently running
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        if (!session.isCurrentlyRunning()) {
            throw new IllegalStateException("Session is not currently active");
        }

        // Check if user is already in queue
        if (queueService.isUserInQueue(userId)) {
            throw new IllegalStateException("User is already in queue");
        }

        // Check if user has an active conversation
        Optional<Conversation> activeConversation = conversationRepository.findActiveByUserId(userId);
        if (activeConversation.isPresent()) {
            Conversation conversation = activeConversation.get();
            // If the conversation is stale (e.g., user refreshed and lost state), cancel it
            log.warn("User {} has an active conversation {}, cancelling it to allow queue join",
                    userId, conversation.getId());
            conversation.cancel();
            conversationRepository.save(conversation);
        }

        // Create queue entry
        QueueEntry entry = QueueEntry.builder()
                .userId(userId)
                .sessionId(sessionId)
                .userName(user.getName())
                .userAvatar(user.getAvatarUrl())
                .proficiencyLevel(user.getProficiencyLevel())
                .joinedAt(Instant.now())
                .build();

        queueService.addToQueue(entry);
        log.info("User {} joined queue for session {}", userId, sessionId);

        // Attempt immediate matching
        tryMatch(sessionId);

        return entry;
    }

    /**
     * Remove a user from the queue.
     */
    public void leaveQueue(UUID userId) {
        queueService.removeFromQueue(userId);
        log.info("User {} left the queue", userId);
    }

    /**
     * Get user's position in queue.
     */
    public int getQueuePosition(UUID userId) {
        return queueService.getQueuePosition(userId);
    }

    /**
     * Get queue size for a session.
     */
    public long getQueueSize(UUID sessionId) {
        return queueService.getQueueSize(sessionId);
    }

    /**
     * Check if user is in queue.
     */
    public boolean isUserInQueue(UUID userId) {
        return queueService.isUserInQueue(userId);
    }

    /**
     * Scheduled task to attempt matching every few seconds.
     */
    @Scheduled(fixedDelay = 3000)
    public void scheduledMatching() {
        // Get all active sessions
        List<Session> activeSessions = sessionRepository.findByCurrentlyRunning();

        if (!activeSessions.isEmpty()) {
            log.debug("Scheduled matching: found {} active sessions", activeSessions.size());
        }

        for (Session session : activeSessions) {
            long queueSize = queueService.getQueueSize(session.getId());
            if (queueSize > 0) {
                log.info("Session {} has {} users in queue", session.getId(), queueSize);
            }
            tryMatch(session.getId());
        }
    }

    /**
     * Attempt to match users in a session queue.
     * Priority:
     * 1) Compatible proficiency level + no previous conversation
     * 2) Any level + no previous conversation
     * 3) Anyone available (even if repeated)
     */
    @Transactional
    public void tryMatch(UUID sessionId) {
        List<QueueEntry> entries = queueService.getQueueEntries(sessionId);

        if (entries.size() < 2) {
            return;
        }

        log.info("Attempting match for session {}. Queue size: {}", sessionId, entries.size());

        // Three-pass matching:
        // Pass 1: Compatible level + no previous conversation
        // Pass 2: Any level + no previous conversation
        // Pass 3: Anyone available (allow repeated conversations)

        for (int pass = 1; pass <= 3; pass++) {
            boolean requireCompatibleLevel = (pass == 1);
            boolean allowRepeated = (pass == 3);

            log.debug("Match pass {}: requireCompatibleLevel={}, allowRepeated={}",
                    pass, requireCompatibleLevel, allowRepeated);

            for (int i = 0; i < entries.size() - 1; i++) {
                QueueEntry entryA = entries.get(i);

                for (int j = i + 1; j < entries.size(); j++) {
                    QueueEntry entryB = entries.get(j);

                    if (canMatch(entryA, entryB, requireCompatibleLevel, allowRepeated)) {
                        createMatch(entryA, entryB, sessionId);
                        // Remove matched entries from local list to continue matching others
                        entries.remove(j);
                        entries.remove(i);
                        i--; // Adjust index after removal
                        break;
                    }
                }
            }
        }
    }

    private boolean canMatch(QueueEntry a, QueueEntry b, boolean requireCompatibleLevel, boolean allowRepeated) {
        log.debug("Checking canMatch: {} vs {} (requireCompatibleLevel={}, allowRepeated={})",
                a.getUserId(), b.getUserId(), requireCompatibleLevel, allowRepeated);

        // Check if either user has blocked the other
        if (relationshipRepository.isBlockedEitherDirection(a.getUserId(), b.getUserId())) {
            log.debug("Users are blocked (either direction), skipping match");
            return false;
        }

        // Check if they already had a conversation in this session
        if (!allowRepeated) {
            boolean hadConversation = conversationRepository.existsByUsersAndSession(
                    a.getUserId(), b.getUserId(), a.getSessionId());
            if (hadConversation) {
                log.debug("Users already had conversation in this session, skipping (allowRepeated=false)");
                return false;
            }
        }

        // If requiring compatible level, check proficiency compatibility
        if (requireCompatibleLevel) {
            boolean compatible = a.canMatchWith(b);
            log.debug("Proficiency check: {} (level={}) vs {} (level={}) = {}",
                    a.getUserId(), a.getProficiencyLevel(),
                    b.getUserId(), b.getProficiencyLevel(), compatible);
            return compatible;
        }

        // Otherwise, allow any match
        log.info("Match found: {} <-> {} (pass criteria met)", a.getUserId(), b.getUserId());
        return true;
    }

    private void createMatch(QueueEntry entryA, QueueEntry entryB, UUID sessionId) {
        // Remove both from queue
        queueService.removeFromQueue(entryA.getUserId());
        queueService.removeFromQueue(entryB.getUserId());

        // Get users
        User userA = userRepository.findById(entryA.getUserId()).orElse(null);
        User userB = userRepository.findById(entryB.getUserId()).orElse(null);
        Session session = sessionRepository.findById(sessionId).orElse(null);

        if (userA == null || userB == null) {
            log.error("Cannot create match: user not found");
            return;
        }

        // Generate topic
        String topic = topicGenerator.generateTopic();

        // Create conversation record
        Conversation conversation = Conversation.builder()
                .userA(userA)
                .userB(userB)
                .session(session)
                .topic(topic)
                .status(ConversationStatus.WAITING)
                .build();

        conversation = conversationRepository.save(conversation);

        log.info("Match created: {} <-> {} for conversation {}",
                entryA.getUserId(), entryB.getUserId(), conversation.getId());

        // Get call duration and break duration from session
        int callDurationSeconds = session != null ? session.getCallDurationSeconds() : 600;
        int breakDurationSeconds = session != null ? session.getBreakDurationSeconds() : 30;

        // Notify both users via WebSocket
        webSocketSessionManager.notifyMatch(
                entryA.getUserId(),
                entryB.getUserId(),
                conversation.getId().toString(),
                entryA.getUserName(),
                entryB.getUserName(),
                entryA.getUserAvatar(),
                entryB.getUserAvatar(),
                topic,
                sessionId,
                callDurationSeconds,
                breakDurationSeconds
        );
    }

    /**
     * Handle conversation start (WebRTC connected).
     */
    @Transactional
    public void startConversation(UUID conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        conversation.start();
        conversationRepository.save(conversation);

        log.info("Conversation {} started", conversationId);
    }

    /**
     * Handle conversation end.
     */
    @Transactional
    public void endConversation(UUID conversationId, boolean completed) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (completed) {
            conversation.complete();
        } else {
            conversation.cancel();
        }

        conversationRepository.save(conversation);

        log.info("Conversation {} ended. Completed: {}", conversationId, completed);
    }
}
