package com.speakup.application.user.dto;

public record UserSettingsResponse(
        String openaiApiKey
) {
    public static UserSettingsResponse from(String rawKey) {
        return new UserSettingsResponse(mask(rawKey));
    }

    private static String mask(String key) {
        if (key == null || key.isEmpty()) {
            return "";
        }
        if (key.length() <= 8) {
            return "****";
        }
        return key.substring(0, 4) + "****" + key.substring(key.length() - 4);
    }
}
