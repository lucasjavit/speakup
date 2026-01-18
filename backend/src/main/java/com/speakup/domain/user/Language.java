package com.speakup.domain.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Supported languages for practice.
 */
@Getter
@RequiredArgsConstructor
public enum Language {
    ENGLISH("English", "en"),
    PORTUGUESE("Portuguese", "pt"),
    SPANISH("Spanish", "es"),
    FRENCH("French", "fr"),
    GERMAN("German", "de"),
    ITALIAN("Italian", "it"),
    JAPANESE("Japanese", "ja"),
    KOREAN("Korean", "ko"),
    MANDARIN("Mandarin Chinese", "zh");

    private final String displayName;
    private final String code;
}
