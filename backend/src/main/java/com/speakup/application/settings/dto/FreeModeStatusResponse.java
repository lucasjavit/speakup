package com.speakup.application.settings.dto;

public record FreeModeStatusResponse(
        boolean enabled,
        String message
) {
}
