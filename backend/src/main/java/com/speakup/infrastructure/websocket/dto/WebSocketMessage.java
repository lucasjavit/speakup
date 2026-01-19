package com.speakup.infrastructure.websocket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Generic WebSocket message format for matching communication.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSocketMessage {

    private String type;
    private Map<String, Object> payload;

    // Message types - Client to Server
    public static final String TYPE_JOIN_QUEUE = "JOIN_QUEUE";
    public static final String TYPE_LEAVE_QUEUE = "LEAVE_QUEUE";
    public static final String TYPE_CALL_ENDED = "CALL_ENDED";
    public static final String TYPE_REJOIN_CALL = "REJOIN_CALL";
    public static final String TYPE_PING = "PING";

    // Message types - Server to Client
    public static final String TYPE_CONNECTED = "CONNECTED";
    public static final String TYPE_QUEUE_JOINED = "QUEUE_JOINED";
    public static final String TYPE_QUEUE_LEFT = "QUEUE_LEFT";
    public static final String TYPE_QUEUE_POSITION = "QUEUE_POSITION";
    public static final String TYPE_MATCH_FOUND = "MATCH_FOUND";
    public static final String TYPE_MATCH_CANCELLED = "MATCH_CANCELLED";
    public static final String TYPE_PARTNER_DISCONNECTED = "PARTNER_DISCONNECTED";
    public static final String TYPE_PARTNER_RECONNECTED = "PARTNER_RECONNECTED";
    public static final String TYPE_WAITING_RECONNECTION = "WAITING_RECONNECTION";
    public static final String TYPE_RECONNECTION_TIMEOUT = "RECONNECTION_TIMEOUT";
    public static final String TYPE_ERROR = "ERROR";
    public static final String TYPE_PONG = "PONG";

    // Factory methods for server messages
    public static WebSocketMessage connected(String peerId) {
        return WebSocketMessage.builder()
                .type(TYPE_CONNECTED)
                .payload(Map.of("peerId", peerId))
                .build();
    }

    public static WebSocketMessage queueJoined(int position, int estimatedWaitSeconds) {
        return WebSocketMessage.builder()
                .type(TYPE_QUEUE_JOINED)
                .payload(Map.of(
                        "position", position,
                        "estimatedWait", estimatedWaitSeconds
                ))
                .build();
    }

    public static WebSocketMessage queueLeft() {
        return WebSocketMessage.builder()
                .type(TYPE_QUEUE_LEFT)
                .payload(Map.of())
                .build();
    }

    public static WebSocketMessage queuePosition(int position, int estimatedWaitSeconds) {
        return WebSocketMessage.builder()
                .type(TYPE_QUEUE_POSITION)
                .payload(Map.of(
                        "position", position,
                        "estimatedWait", estimatedWaitSeconds
                ))
                .build();
    }

    public static WebSocketMessage matchFound(
            String conversationId,
            String peerId,
            String partnerName,
            String partnerAvatar,
            String topic,
            boolean isInitiator,
            String sessionId,
            int callDurationSeconds,
            int breakDurationSeconds) {
        return WebSocketMessage.builder()
                .type(TYPE_MATCH_FOUND)
                .payload(Map.of(
                        "conversationId", conversationId,
                        "peerId", peerId,
                        "partnerName", partnerName,
                        "partnerAvatar", partnerAvatar != null ? partnerAvatar : "",
                        "topic", topic,
                        "isInitiator", isInitiator,
                        "sessionId", sessionId,
                        "callDurationSeconds", callDurationSeconds,
                        "breakDurationSeconds", breakDurationSeconds
                ))
                .build();
    }

    public static WebSocketMessage matchCancelled(String reason) {
        return WebSocketMessage.builder()
                .type(TYPE_MATCH_CANCELLED)
                .payload(Map.of("reason", reason))
                .build();
    }

    public static WebSocketMessage partnerDisconnected() {
        return WebSocketMessage.builder()
                .type(TYPE_PARTNER_DISCONNECTED)
                .payload(Map.of())
                .build();
    }

    public static WebSocketMessage partnerReconnected() {
        return WebSocketMessage.builder()
                .type(TYPE_PARTNER_RECONNECTED)
                .payload(Map.of())
                .build();
    }

    public static WebSocketMessage waitingReconnection(String partnerName, int timeoutSeconds) {
        return WebSocketMessage.builder()
                .type(TYPE_WAITING_RECONNECTION)
                .payload(Map.of(
                        "partnerName", partnerName,
                        "timeoutSeconds", timeoutSeconds
                ))
                .build();
    }

    public static WebSocketMessage reconnectionTimeout() {
        return WebSocketMessage.builder()
                .type(TYPE_RECONNECTION_TIMEOUT)
                .payload(Map.of("reason", "Partner did not reconnect in time"))
                .build();
    }

    public static WebSocketMessage error(String code, String message) {
        return WebSocketMessage.builder()
                .type(TYPE_ERROR)
                .payload(Map.of(
                        "code", code,
                        "message", message
                ))
                .build();
    }

    public static WebSocketMessage pong() {
        return WebSocketMessage.builder()
                .type(TYPE_PONG)
                .payload(Map.of("timestamp", System.currentTimeMillis()))
                .build();
    }

    // Helper methods to extract payload data
    public String getPayloadString(String key) {
        if (payload == null) return null;
        Object value = payload.get(key);
        return value != null ? value.toString() : null;
    }

    public Integer getPayloadInt(String key) {
        if (payload == null) return null;
        Object value = payload.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    public Boolean getPayloadBoolean(String key) {
        if (payload == null) return null;
        Object value = payload.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return null;
    }
}
