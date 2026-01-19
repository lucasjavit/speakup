package com.speakup.infrastructure.websocket;

import com.speakup.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.UUID;

/**
 * WebSocket handshake interceptor for JWT authentication.
 * Extracts user ID from JWT token and adds it to session attributes.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    public static final String USER_ID_ATTRIBUTE = "userId";
    public static final String USER_NAME_ATTRIBUTE = "userName";

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String token = extractToken(request);

        if (token == null || !jwtTokenProvider.validateToken(token) || !jwtTokenProvider.isAccessToken(token)) {
            log.warn("WebSocket connection rejected: invalid or missing token");
            return false;
        }

        try {
            UUID userId = jwtTokenProvider.getUserIdFromToken(token);
            String userName = jwtTokenProvider.getUserNameFromToken(token);

            attributes.put(USER_ID_ATTRIBUTE, userId);
            attributes.put(USER_NAME_ATTRIBUTE, userName);

            log.debug("WebSocket connection authenticated for user: {}", userId);
            return true;
        } catch (Exception e) {
            log.error("Error extracting user info from token", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // No action needed after handshake
    }

    private String extractToken(ServerHttpRequest request) {
        // Try to get token from query parameter
        if (request instanceof ServletServerHttpRequest servletRequest) {
            String token = servletRequest.getServletRequest().getParameter("token");
            if (token != null && !token.isBlank()) {
                return token;
            }
        }

        // Try to get from Authorization header
        String authHeader = request.getHeaders().getFirst("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }
}
