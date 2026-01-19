package com.speakup.infrastructure.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.speakup.infrastructure.websocket.dto.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler for real-time matching communication.
 * Handles queue operations and match notifications.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MatchingWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final WebSocketSessionManager sessionManager;

    // Track active sessions by user ID
    private final Map<UUID, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        UUID userId = getUserId(session);
        String userName = getUserName(session);

        if (userId == null) {
            log.warn("Connection without user ID, closing session");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        // Close existing session if user reconnects
        WebSocketSession existingSession = userSessions.put(userId, session);
        if (existingSession != null && existingSession.isOpen()) {
            log.info("User {} reconnected, closing previous session", userId);
            existingSession.close(CloseStatus.NORMAL);
        }

        sessionManager.registerSession(userId, session);
        log.info("WebSocket connection established for user: {} ({})", userName, userId);

        // Send welcome message
        sendMessage(session, WebSocketMessage.connected(userId.toString()));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        UUID userId = getUserId(session);
        if (userId == null) {
            return;
        }

        try {
            WebSocketMessage wsMessage = objectMapper.readValue(message.getPayload(), WebSocketMessage.class);
            log.debug("Received message from user {}: {}", userId, wsMessage.getType());

            sessionManager.handleMessage(userId, wsMessage);
        } catch (Exception e) {
            log.error("Error processing WebSocket message from user {}", userId, e);
            sendMessage(session, WebSocketMessage.error("INVALID_MESSAGE", "Failed to process message"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        UUID userId = getUserId(session);
        if (userId != null) {
            userSessions.remove(userId, session);
            sessionManager.unregisterSession(userId);
            log.info("WebSocket connection closed for user: {}. Status: {}", userId, status);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        UUID userId = getUserId(session);
        log.error("WebSocket transport error for user {}", userId, exception);

        if (session.isOpen()) {
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    public void sendMessage(WebSocketSession session, WebSocketMessage message) {
        if (session == null || !session.isOpen()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        } catch (IOException e) {
            log.error("Error sending WebSocket message", e);
        }
    }

    public void sendMessageToUser(UUID userId, WebSocketMessage message) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            sendMessage(session, message);
        } else {
            log.warn("Cannot send message to user {}: session not found or closed", userId);
        }
    }

    public boolean isUserConnected(UUID userId) {
        WebSocketSession session = userSessions.get(userId);
        return session != null && session.isOpen();
    }

    private UUID getUserId(WebSocketSession session) {
        Object userId = session.getAttributes().get(WebSocketAuthInterceptor.USER_ID_ATTRIBUTE);
        return userId instanceof UUID ? (UUID) userId : null;
    }

    private String getUserName(WebSocketSession session) {
        Object userName = session.getAttributes().get(WebSocketAuthInterceptor.USER_NAME_ATTRIBUTE);
        return userName instanceof String ? (String) userName : "Unknown";
    }
}
