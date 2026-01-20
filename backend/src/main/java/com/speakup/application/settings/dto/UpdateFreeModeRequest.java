package com.speakup.application.settings.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateFreeModeRequest(
        @NotNull Boolean enabled,
        String message
) {
}
