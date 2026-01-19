package com.speakup.infrastructure.websocket;

import com.speakup.application.matching.MatchingService;
import com.speakup.infrastructure.websocket.dto.WebSocketMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages WebSocket sessions and coordinates with matching service.
 */
@Slf4j
@Component
public class WebSocketSessionManager {

    private static final int RECONNECTION_TIMEOUT_SECONDS = 10;

    private final MatchingWebSocketHandler webSocketHandler;
    private final MatchingService matchingService;

    // Track which session each user is in (for queue management)
    private final Map<UUID, UUID> userToSessionMap = new ConcurrentHashMap<>();

    // Track users in queue per session
    private final Map<UUID, Map<UUID, Long>> sessionQueues = new ConcurrentHashMap<>();

    // Track active conversations: conversationId -> ActiveConversation
    private final Map<UUID, ActiveConversation> activeConversations = new ConcurrentHashMap<>();

    // Track user's active conversation: userId -> conversationId
    private final Map<UUID, UUID> userToConversation = new ConcurrentHashMap<>();

    // Track disconnected users waiting for reconnection: userId -> DisconnectionInfo
    private final Map<UUID, DisconnectionInfo> disconnectedUsers = new ConcurrentHashMap<>();

    public WebSocketSessionManager(
            @Lazy MatchingWebSocketHandler webSocketHandler,
            @Lazy MatchingService matchingService) {
        this.webSocketHandler = webSocketHandler;
        this.matchingService = matchingService;
    }

    // Inner class to track active conversation state
    private static class ActiveConversation {
        UUID conversationId;
        UUID sessionId;
        UUID userAId;
        UUID userBId;
        String userAName;
        String userBName;
        String topic;
        int callDurationSeconds;
        int breakDurationSeconds;
        Instant startedAt;

        ActiveConversation(UUID conversationId, UUID sessionId, UUID userAId, UUID userBId, String userAName, String userBName, String topic, int callDurationSeconds, int breakDurationSeconds) {
            this.conversationId = conversationId;
            this.sessionId = sessionId;
            this.userAId = userAId;
            this.userBId = userBId;
            this.userAName = userAName;
            this.userBName = userBName;
            this.topic = topic;
            this.callDurationSeconds = callDurationSeconds;
            this.breakDurationSeconds = breakDurationSeconds;
            this.startedAt = Instant.now();
        }

        UUID getPartnerId(UUID userId) {
            return userId.equals(userAId) ? userBId : userAId;
        }

        String getPartnerName(UUID userId) {
            return userId.equals(userAId) ? userBName : userAName;
        }

        String getUserName(UUID userId) {
            return userId.equals(userAId) ? userAName : userBName;
        }
    }

    // Inner class to track disconnection info for reconnection
    private static class DisconnectionInfo {
        UUID userId;
        UUID conversationId;
        UUID partnerId;
        String userName;
        Instant disconnectedAt;

        DisconnectionInfo(UUID userId, UUID conversationId, UUID partnerId, String userName) {
            this.userId = userId;
            this.conversationId = conversationId;
            this.partnerId = partnerId;
            this.userName = userName;
            this.disconnectedAt = Instant.now();
        }

        boolean isExpired() {
            return Instant.now().isAfter(disconnectedAt.plusSeconds(RECONNECTION_TIMEOUT_SECONDS));
        }

        int getRemainingSeconds() {
            long elapsed = Instant.now().getEpochSecond() - disconnectedAt.getEpochSecond();
            return Math.max(0, RECONNECTION_TIMEOUT_SECONDS - (int) elapsed);
        }
    }

    public void registerSession(UUID userId, WebSocketSession session) {
        log.debug("Registering WebSocket session for user: {}", userId);

        // Check if this user was disconnected and is now reconnecting
        DisconnectionInfo disconnectionInfo = disconnectedUsers.remove(userId);
        if (disconnectionInfo != null && !disconnectionInfo.isExpired()) {
            log.info("User {} reconnected within timeout window", userId);
            handleUserReconnection(userId, disconnectionInfo);
        }
    }

    public void unregisterSession(UUID userId) {
        log.debug("Unregistering WebSocket session for user: {}", userId);

        // Remove from any queue they might be in
        UUID sessionId = userToSessionMap.remove(userId);
        if (sessionId != null) {
            Map<UUID, Long> queue = sessionQueues.get(sessionId);
            if (queue != null) {
                queue.remove(userId);
                log.info("User {} removed from queue for session {}", userId, sessionId);
            }
        }

        // Check if user was in an active conversation
        UUID conversationId = userToConversation.get(userId);
        if (conversationId != null) {
            ActiveConversation conversation = activeConversations.get(conversationId);
            if (conversation != null) {
                UUID partnerId = conversation.getPartnerId(userId);
                String userName = conversation.getUserName(userId);

                // Track this user as disconnected for potential reconnection
                disconnectedUsers.put(userId, new DisconnectionInfo(
                        userId, conversationId, partnerId, userName
                ));

                // Notify partner that this user disconnected (they should wait)
                log.info("User {} disconnected from conversation {}, partner {} will wait for reconnection",
                        userId, conversationId, partnerId);
                webSocketHandler.sendMessageToUser(partnerId,
                        WebSocketMessage.waitingReconnection(userName, RECONNECTION_TIMEOUT_SECONDS));
            }
        }
    }

    private void handleUserReconnection(UUID userId, DisconnectionInfo info) {
        // Notify partner that user reconnected
        webSocketHandler.sendMessageToUser(info.partnerId, WebSocketMessage.partnerReconnected());

        // Re-send match info to reconnecting user so they can rejoin the call
        ActiveConversation conversation = activeConversations.get(info.conversationId);
        if (conversation != null) {
            String partnerName = conversation.getPartnerName(userId);
            UUID partnerId = conversation.getPartnerId(userId);

            // The reconnecting user needs the call info again
            String sessionIdStr = conversation.sessionId != null ? conversation.sessionId.toString() : "";
            webSocketHandler.sendMessageToUser(userId, WebSocketMessage.matchFound(
                    info.conversationId.toString(),
                    partnerId.toString(),
                    partnerName,
                    "", // avatar - we don't have it stored, could be added
                    conversation.topic,
                    false, // Not initiator on reconnection
                    sessionIdStr,
                    conversation.callDurationSeconds,
                    conversation.breakDurationSeconds
            ));

            log.info("User {} successfully reconnected to conversation {} with partner {}",
                    userId, info.conversationId, partnerId);
        }
    }

    // Scheduled task to check for expired reconnection timeouts
    @Scheduled(fixedRate = 1000) // Check every second
    public void checkReconnectionTimeouts() {
        List<UUID> expiredUsers = new ArrayList<>();

        disconnectedUsers.forEach((userId, info) -> {
            if (info.isExpired()) {
                expiredUsers.add(userId);
            }
        });

        for (UUID userId : expiredUsers) {
            DisconnectionInfo info = disconnectedUsers.remove(userId);
            if (info != null) {
                handleReconnectionTimeout(info);
            }
        }
    }

    private void handleReconnectionTimeout(DisconnectionInfo info) {
        log.info("Reconnection timeout for user {} in conversation {}", info.userId, info.conversationId);

        // Notify partner that reconnection timed out
        webSocketHandler.sendMessageToUser(info.partnerId, WebSocketMessage.reconnectionTimeout());

        // Clean up conversation tracking
        activeConversations.remove(info.conversationId);
        userToConversation.remove(info.userId);
        userToConversation.remove(info.partnerId);
    }

    public void handleMessage(UUID userId, WebSocketMessage message) {
        String type = message.getType();

        switch (type) {
            case WebSocketMessage.TYPE_JOIN_QUEUE -> handleJoinQueue(userId, message);
            case WebSocketMessage.TYPE_LEAVE_QUEUE -> handleLeaveQueue(userId);
            case WebSocketMessage.TYPE_CALL_ENDED -> handleCallEnded(userId, message);
            case WebSocketMessage.TYPE_REJOIN_CALL -> handleRejoinCall(userId, message);
            case WebSocketMessage.TYPE_PING -> handlePing(userId);
            default -> log.warn("Unknown message type from user {}: {}", userId, type);
        }
    }

    private void handleJoinQueue(UUID userId, WebSocketMessage message) {
        String sessionIdStr = message.getPayloadString("sessionId");
        if (sessionIdStr == null) {
            sendError(userId, "INVALID_SESSION", "Session ID is required");
            return;
        }

        try {
            UUID sessionId = UUID.fromString(sessionIdStr);

            // Check if already in a queue
            if (userToSessionMap.containsKey(userId)) {
                sendError(userId, "ALREADY_IN_QUEUE", "You are already in a queue");
                return;
            }

            // Add to local tracking
            userToSessionMap.put(userId, sessionId);
            sessionQueues.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>())
                    .put(userId, System.currentTimeMillis());

            // Add to Redis queue via MatchingService
            try {
                matchingService.joinQueue(userId, sessionId);
            } catch (Exception e) {
                log.warn("Error adding to matching service queue: {}. Using local matching.", e.getMessage());
            }

            int position = getQueuePosition(sessionId, userId);
            int estimatedWait = position * 30; // Rough estimate: 30 seconds per position

            webSocketHandler.sendMessageToUser(userId, WebSocketMessage.queueJoined(position, estimatedWait));
            log.info("User {} joined queue for session {}. Position: {}", userId, sessionId, position);

        } catch (IllegalArgumentException e) {
            sendError(userId, "INVALID_SESSION", "Invalid session ID format");
        }
    }

    private void handleLeaveQueue(UUID userId) {
        UUID sessionId = userToSessionMap.remove(userId);
        if (sessionId != null) {
            Map<UUID, Long> queue = sessionQueues.get(sessionId);
            if (queue != null) {
                queue.remove(userId);
            }
            // Remove from Redis queue
            matchingService.leaveQueue(userId);
            webSocketHandler.sendMessageToUser(userId, WebSocketMessage.queueLeft());
            log.info("User {} left queue for session {}", userId, sessionId);
        }
    }

    private void handleCallEnded(UUID userId, WebSocketMessage message) {
        String conversationIdStr = message.getPayloadString("conversationId");
        String reason = message.getPayloadString("reason");
        log.info("Call ended for user {}. Conversation: {}, Reason: {}", userId, conversationIdStr, reason);

        if (conversationIdStr != null) {
            try {
                UUID conversationId = UUID.fromString(conversationIdStr);

                // Clean up conversation tracking
                ActiveConversation conversation = activeConversations.remove(conversationId);
                if (conversation != null) {
                    userToConversation.remove(conversation.userAId);
                    userToConversation.remove(conversation.userBId);

                    // Also clean up any pending disconnection info
                    disconnectedUsers.remove(conversation.userAId);
                    disconnectedUsers.remove(conversation.userBId);
                }
            } catch (IllegalArgumentException e) {
                log.warn("Invalid conversation ID in CALL_ENDED: {}", conversationIdStr);
            }
        }
    }

    private void handleRejoinCall(UUID userId, WebSocketMessage message) {
        String conversationIdStr = message.getPayloadString("conversationId");
        if (conversationIdStr == null) {
            sendError(userId, "INVALID_CONVERSATION", "Conversation ID is required");
            return;
        }

        try {
            UUID conversationId = UUID.fromString(conversationIdStr);
            ActiveConversation conversation = activeConversations.get(conversationId);

            if (conversation == null) {
                sendError(userId, "CONVERSATION_NOT_FOUND", "Conversation not found or already ended");
                return;
            }

            // Verify user is part of this conversation
            if (!userId.equals(conversation.userAId) && !userId.equals(conversation.userBId)) {
                sendError(userId, "UNAUTHORIZED", "You are not part of this conversation");
                return;
            }

            UUID partnerId = conversation.getPartnerId(userId);
            String partnerName = conversation.getPartnerName(userId);

            // Remove from disconnected tracking
            disconnectedUsers.remove(userId);

            // Notify partner
            webSocketHandler.sendMessageToUser(partnerId, WebSocketMessage.partnerReconnected());

            // Send match info to rejoin
            String sessionIdStr = conversation.sessionId != null ? conversation.sessionId.toString() : "";
            webSocketHandler.sendMessageToUser(userId, WebSocketMessage.matchFound(
                    conversationId.toString(),
                    partnerId.toString(),
                    partnerName,
                    "",
                    conversation.topic,
                    false,
                    sessionIdStr,
                    conversation.callDurationSeconds,
                    conversation.breakDurationSeconds
            ));

            log.info("User {} rejoined conversation {}", userId, conversationId);

        } catch (IllegalArgumentException e) {
            sendError(userId, "INVALID_CONVERSATION", "Invalid conversation ID format");
        }
    }

    private void handlePing(UUID userId) {
        webSocketHandler.sendMessageToUser(userId, WebSocketMessage.pong());
    }

    public void notifyMatch(UUID userAId, UUID userBId, String conversationId,
                            String userAName, String userBName,
                            String userAAvatar, String userBAvatar,
                            String topic, UUID sessionId, int callDurationSeconds, int breakDurationSeconds) {
        UUID convId = UUID.fromString(conversationId);

        // Track the active conversation
        ActiveConversation conversation = new ActiveConversation(convId, sessionId, userAId, userBId, userAName, userBName, topic, callDurationSeconds, breakDurationSeconds);
        activeConversations.put(convId, conversation);
        userToConversation.put(userAId, convId);
        userToConversation.put(userBId, convId);

        String sessionIdStr = sessionId != null ? sessionId.toString() : "";

        // Notify user A
        webSocketHandler.sendMessageToUser(userAId, WebSocketMessage.matchFound(
                conversationId,
                userBId.toString(),
                userBName,
                userBAvatar,
                topic,
                true,  // User A is the initiator
                sessionIdStr,
                callDurationSeconds,
                breakDurationSeconds
        ));

        // Notify user B
        webSocketHandler.sendMessageToUser(userBId, WebSocketMessage.matchFound(
                conversationId,
                userAId.toString(),
                userAName,
                userAAvatar,
                topic,
                false,  // User B answers the call
                sessionIdStr,
                callDurationSeconds,
                breakDurationSeconds
        ));

        // Remove both from queue
        UUID removedSessionId = userToSessionMap.remove(userAId);
        userToSessionMap.remove(userBId);
        if (removedSessionId != null) {
            Map<UUID, Long> queue = sessionQueues.get(removedSessionId);
            if (queue != null) {
                queue.remove(userAId);
                queue.remove(userBId);
            }
        }

        log.info("Match notified: {} <-> {} for conversation {}", userAId, userBId, conversationId);
    }

    public void notifyPartnerDisconnected(UUID userId) {
        webSocketHandler.sendMessageToUser(userId, WebSocketMessage.partnerDisconnected());
    }

    public void notifyMatchCancelled(UUID userId, String reason) {
        webSocketHandler.sendMessageToUser(userId, WebSocketMessage.matchCancelled(reason));
    }

    private int getQueuePosition(UUID sessionId, UUID userId) {
        Map<UUID, Long> queue = sessionQueues.get(sessionId);
        if (queue == null) return 0;

        long userJoinTime = queue.getOrDefault(userId, System.currentTimeMillis());
        return (int) queue.values().stream()
                .filter(joinTime -> joinTime < userJoinTime)
                .count() + 1;
    }

    private void sendError(UUID userId, String code, String message) {
        webSocketHandler.sendMessageToUser(userId, WebSocketMessage.error(code, message));
    }

    public boolean isUserInQueue(UUID userId) {
        return userToSessionMap.containsKey(userId);
    }

    public int getQueueSize(UUID sessionId) {
        Map<UUID, Long> queue = sessionQueues.get(sessionId);
        return queue != null ? queue.size() : 0;
    }

    public boolean isUserInConversation(UUID userId) {
        return userToConversation.containsKey(userId);
    }

    public UUID getUserConversation(UUID userId) {
        return userToConversation.get(userId);
    }
}
