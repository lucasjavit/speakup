package com.speakup.presentation.api.admin;

import com.speakup.application.settings.SettingsService;
import com.speakup.application.settings.dto.ApplicationSettingResponse;
import com.speakup.application.settings.dto.FreeModeStatusResponse;
import com.speakup.application.settings.dto.UpdateFreeModeRequest;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin controller for managing application settings.
 */
@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN')")
@Tag(name = "Admin - Settings", description = "Application settings management for administrators")
public class AdminSettingsController {

    private final SettingsService settingsService;

    @GetMapping
    @Operation(summary = "Get all settings", description = "Returns all application settings")
    public ResponseEntity<ApiResponse<List<ApplicationSettingResponse>>> getAllSettings() {
        List<ApplicationSettingResponse> settings = settingsService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/free-mode")
    @Operation(summary = "Get free mode status", description = "Returns current free mode configuration")
    public ResponseEntity<ApiResponse<FreeModeStatusResponse>> getFreeModeStatus() {
        FreeModeStatusResponse status = settingsService.getFreeModeStatus();
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @PutMapping("/free-mode")
    @Operation(summary = "Update free mode", description = "Enable or disable free mode for the application")
    public ResponseEntity<ApiResponse<FreeModeStatusResponse>> updateFreeMode(
            @Valid @RequestBody UpdateFreeModeRequest request) {
        FreeModeStatusResponse status = settingsService.updateFreeMode(request.enabled(), request.message());
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @GetMapping("/notify-on-empty-queue")
    @Operation(summary = "Get notify on empty queue status")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> getNotifyOnEmptyQueue() {
        boolean enabled = settingsService.isNotifyOnEmptyQueueEnabled();
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("enabled", enabled)));
    }

    @PutMapping("/notify-on-empty-queue")
    @Operation(summary = "Toggle notify on empty queue", description = "Enable or disable email notifications when a user joins an empty queue")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> updateNotifyOnEmptyQueue(
            @RequestBody java.util.Map<String, Boolean> request) {
        boolean enabled = settingsService.updateNotifyOnEmptyQueue(request.getOrDefault("enabled", false));
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("enabled", enabled)));
    }

    @GetMapping("/settings-page")
    @Operation(summary = "Get settings page status")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> getSettingsPageEnabled() {
        boolean enabled = settingsService.isSettingsPageEnabled();
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("enabled", enabled)));
    }

    @PutMapping("/settings-page")
    @Operation(summary = "Toggle settings page", description = "Enable or disable the user Settings page")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> updateSettingsPageEnabled(
            @RequestBody java.util.Map<String, Boolean> request) {
        boolean enabled = settingsService.updateSettingsPageEnabled(request.getOrDefault("enabled", false));
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("enabled", enabled)));
    }

    @PutMapping("/{key}")
    @Operation(summary = "Update a setting", description = "Update a specific setting value")
    public ResponseEntity<ApiResponse<ApplicationSettingResponse>> updateSetting(
            @PathVariable String key,
            @RequestBody String value) {
        ApplicationSettingResponse setting = settingsService.updateSetting(key, value);
        return ResponseEntity.ok(ApiResponse.success(setting));
    }
}
