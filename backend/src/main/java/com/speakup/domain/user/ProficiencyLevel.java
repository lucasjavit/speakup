package com.speakup.domain.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Language proficiency levels based on CEFR framework.
 */
@Getter
@RequiredArgsConstructor
public enum ProficiencyLevel {
    BEGINNER("A1", "Beginner", 1),
    ELEMENTARY("A2", "Elementary", 2),
    INTERMEDIATE("B1", "Intermediate", 3),
    UPPER_INTERMEDIATE("B2", "Upper Intermediate", 4),
    ADVANCED("C1", "Advanced", 5),
    FLUENT("C2", "Fluent", 6);

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
