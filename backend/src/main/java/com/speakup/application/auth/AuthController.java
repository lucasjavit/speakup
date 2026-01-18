package com.speakup.application.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.speakup.application.auth.dto.AuthResponse;
import com.speakup.application.auth.dto.GoogleAuthRequest;
import com.speakup.application.auth.dto.RefreshTokenRequest;
import com.speakup.application.auth.dto.UserResponse;
import com.speakup.domain.user.AuthProvider;
import com.speakup.domain.user.Role;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.infrastructure.security.GoogleTokenVerifier;
import com.speakup.infrastructure.security.JwtTokenProvider;
import com.speakup.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication controller for handling auth-related endpoints.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final GoogleTokenVerifier googleTokenVerifier;

    @PostMapping("/google")
    @Operation(summary = "Authenticate with Google", description = "Validates Google ID Token and returns JWT tokens")
    public ResponseEntity<AuthResponse> authenticateWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        var payloadOpt = googleTokenVerifier.verify(request.idToken());

        if (payloadOpt.isEmpty()) {
            log.warn("Invalid Google ID Token received");
            return ResponseEntity.status(401).build();
        }

        GoogleIdToken.Payload payload = payloadOpt.get();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String avatarUrl = (String) payload.get("picture");
        String providerId = payload.getSubject();

        // Find or create user
        User user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Update existing user info
                    existingUser.setName(name);
                    existingUser.setAvatarUrl(avatarUrl);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Check if there's no SUPER_ADMIN yet - make first user SUPER_ADMIN
                    boolean noSuperAdminExists = !userRepository.existsByRole(Role.SUPER_ADMIN);

                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .avatarUrl(avatarUrl)
                            .provider(AuthProvider.GOOGLE)
                            .providerId(providerId)
                            .active(true)
                            .profileCompleted(false)
                            .role(noSuperAdminExists ? Role.SUPER_ADMIN : Role.USER)
                            .build();

                    if (noSuperAdminExists) {
                        log.info("No SUPER_ADMIN exists, assigning SUPER_ADMIN role to {}", email);
                    }

                    return userRepository.save(newUser);
                });

        // Generate JWT tokens
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        log.info("User {} authenticated via Google", email);

        return ResponseEntity.ok(new AuthResponse(
                accessToken,
                refreshToken,
                UserResponse.from(user)
        ));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the currently authenticated user")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        return userRepository.findById(principal.getId())
                .map(user -> ResponseEntity.ok(UserResponse.from(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Exchange refresh token for new access token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();

        if (!tokenProvider.validateToken(refreshToken) || !tokenProvider.isRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).build();
        }

        var userId = tokenProvider.getUserIdFromToken(refreshToken);

        return userRepository.findById(userId)
                .map(user -> {
                    String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
                    String newRefreshToken = tokenProvider.generateRefreshToken(user.getId());
                    return ResponseEntity.ok(new AuthResponse(newAccessToken, newRefreshToken, UserResponse.from(user)));
                })
                .orElse(ResponseEntity.status(401).build());
    }
}
