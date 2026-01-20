package com.speakup.application.settings.dto;

import com.speakup.domain.settings.ApplicationSetting;

import java.time.Instant;
import java.util.UUID;

public record ApplicationSettingResponse(
        UUID id,
        String key,
        String value,
        String description,
        Instant updatedAt
) {
    public static ApplicationSettingResponse from(ApplicationSetting setting) {
        return new ApplicationSettingResponse(
                setting.getId(),
                setting.getKey(),
                setting.getValue(),
                setting.getDescription(),
                setting.getUpdatedAt()
        );
    }
}
