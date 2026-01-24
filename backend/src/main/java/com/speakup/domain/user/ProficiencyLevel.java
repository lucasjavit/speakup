package com.speakup.domain.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Language proficiency levels for user evaluation.
 */
@Getter
@RequiredArgsConstructor
public enum ProficiencyLevel {
    BASIC("Basic", 1),
    ELEMENTARY("Elementary", 2),
    LEVEL_UP("Level Up", 3),
    EXPERT("Expert", 4);

    private final String displayName;
    private final int numericLevel;

    /**
     * Check if this level is adjacent to another level (for matching purposes).
     */
    public boolean isAdjacentTo(ProficiencyLevel other) {
        return Math.abs(this.numericLevel - other.numericLevel) <= 1;
    }
}
