package com.speakup.domain.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Language proficiency levels based on CEFR framework.
 */
@Getter
@RequiredArgsConstructor
public enum ProficiencyLevel {
    BEGINNER("A1-A2", "Beginner", 1),
    INTERMEDIATE("B1-B2", "Intermediate", 2),
    ADVANCED("C1-C2", "Advanced", 3);

    private final String cefrLevel;
    private final String displayName;
    private final int numericLevel;

    /**
     * Check if this level is adjacent to another level (for matching purposes).
     */
    public boolean isAdjacentTo(ProficiencyLevel other) {
        return Math.abs(this.numericLevel - other.numericLevel) <= 1;
    }
}
