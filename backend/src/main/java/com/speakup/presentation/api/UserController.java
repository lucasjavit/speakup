package com.speakup.presentation.api;

import com.speakup.application.consent.ConsentService;
import com.speakup.application.consent.dto.ConsentRequest;
import com.speakup.application.consent.dto.ConsentResponse;
import com.speakup.application.presence.PresenceService;
import com.speakup.application.settings.SettingsService;
import com.speakup.application.user.UserService;
import com.speakup.application.user.dto.CompleteProfileRequest;
import com.speakup.application.user.dto.UpdateUserSettingsRequest;
import com.speakup.application.user.dto.UserDataExport;
import com.speakup.application.user.dto.UserResponse;
import com.speakup.application.user.dto.UserSettingsResponse;
import com.speakup.domain.consent.ConsentType;
import com.speakup.infrastructure.security.UserPrincipal;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for user operations.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;
    private final ConsentService consentService;
    private final PresenceService presenceService;
    private final SettingsService settingsService;

    @GetMapping("/me/presence")
    @Operation(summary = "Heartbeat for online presence", description = "Call periodically to be counted as logged in. TTL 5 minutes.")
    public ResponseEntity<Void> presence(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null) {
            presenceService.touch(principal.getId());
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me/presence")
    @Operation(summary = "Remove from online count", description = "Call on logout to be removed from the online users count immediately.")
    public ResponseEntity<Void> removePresence(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null) {
            presenceService.remove(principal.getId());
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the authenticated user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserResponse user = userService.getUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable UUID id) {
        UserResponse user = userService.getUser(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/{id}/profile")
    @Operation(summary = "Complete user profile by ID")
    public ResponseEntity<ApiResponse<UserResponse>> completeProfileById(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteProfileRequest request
    ) {
        UserResponse user = userService.completeProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/profile")
    @Operation(summary = "Complete current user profile", description = "Updates profile for the authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> completeProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteProfileRequest request
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserResponse user = userService.completeProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    // ==================== User Settings Endpoints ====================

    @GetMapping("/settings-page-enabled")
    @Operation(summary = "Check if settings page is enabled", description = "Returns whether the settings page is accessible to users")
    public ResponseEntity<ApiResponse<Boolean>> isSettingsPageEnabled() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.isSettingsPageEnabled()));
    }

    @GetMapping("/me/settings")
    @Operation(summary = "Get user settings", description = "Returns user settings with masked API keys")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> getMySettings(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserSettingsResponse settings = userService.getUserSettings(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @PutMapping("/me/settings")
    @Operation(summary = "Update user settings", description = "Updates user settings like API keys")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> updateMySettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateUserSettingsRequest request
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserSettingsResponse settings = userService.updateUserSettings(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    // ==================== GDPR/LGPD Endpoints ====================

    @GetMapping("/me/export")
    @Operation(summary = "Export user data", description = "GDPR Right to Data Portability - exports all user data")
    public ResponseEntity<ApiResponse<UserDataExport>> exportMyData(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserDataExport data = userService.exportUserData(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Delete user account", description = "GDPR Right to Erasure - permanently deletes user account and all data")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        userService.deleteUserCompletely(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ==================== Consent Management Endpoints ====================

    @GetMapping("/me/consents")
    @Operation(summary = "Get user consents", description = "Returns all consent records for the authenticated user")
    public ResponseEntity<ApiResponse<List<ConsentResponse>>> getMyConsents(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        List<ConsentResponse> consents = consentService.getUserConsents(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(consents));
    }

    @PostMapping("/me/consents")
    @Operation(summary = "Grant consent", description = "Records user consent for a specific data processing type")
    public ResponseEntity<ApiResponse<ConsentResponse>> grantConsent(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ConsentRequest request,
            HttpServletRequest httpRequest
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        String ipAddress = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        ConsentResponse consent = consentService.grantConsent(
                principal.getId(),
                request.consentType(),
                ipAddress,
                userAgent
        );
        return ResponseEntity.ok(ApiResponse.success(consent));
    }

    @DeleteMapping("/me/consents/{type}")
    @Operation(summary = "Withdraw consent", description = "Withdraws previously given consent")
    public ResponseEntity<ApiResponse<Void>> withdrawConsent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable ConsentType type
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        consentService.withdrawConsent(principal.getId(), type);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Extract client IP address from request, considering proxies.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
