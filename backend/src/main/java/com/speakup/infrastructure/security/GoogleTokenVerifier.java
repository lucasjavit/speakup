package com.speakup.infrastructure.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.Optional;

/**
 * Verifies Google ID Tokens received from the frontend.
 */
@Slf4j
@Component
public class GoogleTokenVerifier {

    @Value("${google.client-id}")
    private String clientId;

    private GoogleIdTokenVerifier verifier;

    @PostConstruct
    public void init() {
        log.info("Initializing GoogleTokenVerifier with clientId: {}",
                clientId != null ? clientId.substring(0, Math.min(20, clientId.length())) + "..." : "NULL");
        verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    /**
     * Verifies a Google ID Token and returns the payload if valid.
     *
     * @param idTokenString the ID token string from Google Sign-In
     * @return the token payload if valid, empty otherwise
     */
    public Optional<GoogleIdToken.Payload> verify(String idTokenString) {
        try {
            if (idTokenString == null || idTokenString.isBlank()) {
                log.warn("Google ID Token is null or blank");
                return Optional.empty();
            }
            
            if (clientId == null || clientId.isBlank()) {
                log.error("Google Client ID is not configured! Please set google.client-id in application.yml or GOOGLE_CLIENT_ID environment variable");
                return Optional.empty();
            }
            
            log.debug("Verifying token (first 50 chars): {}",
                    idTokenString.substring(0, Math.min(50, idTokenString.length())));
            log.debug("Using Client ID: {}...", clientId.substring(0, Math.min(20, clientId.length())));
            
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                log.info("Token verified successfully for: {}", idToken.getPayload().getEmail());
                return Optional.of(idToken.getPayload());
            }
            log.warn("Invalid Google ID Token - verifier returned null. This usually means the token audience (client ID) doesn't match. Token length: {}, Client ID configured: {}...",
                    idTokenString.length(),
                    clientId.substring(0, Math.min(20, clientId.length())));
            return Optional.empty();
        } catch (GeneralSecurityException e) {
            log.error("Security error verifying Google ID Token: {}", e.getMessage(), e);
            return Optional.empty();
        } catch (IOException e) {
            log.error("IO error verifying Google ID Token (network issue?): {}", e.getMessage(), e);
            return Optional.empty();
        } catch (Exception e) {
            log.error("Unexpected error verifying Google ID Token: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }
}
