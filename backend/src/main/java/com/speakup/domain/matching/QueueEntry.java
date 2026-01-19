package com.speakup.domain.matching;

import com.speakup.domain.user.ProficiencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Represents a user waiting in the matching queue.
 * Stored in Redis for fast access and matching.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueEntry implements Serializable {

    private UUID userId;
    private UUID sessionId;
    private String userName;
    private String userAvatar;
    private ProficiencyLevel proficiencyLevel;
    private Instant joinedAt;

    /**
     * Get the peer ID for PeerJS (same as user ID).
     */
    public String getPeerId() {
        return userId.toString();
    }

    /**
     * Check if this entry can be matched with another entry.
     * Basic matching rules:
     * 1. Different users
     * 2. Same proficiency level (or adjacent)
     */
    public boolean canMatchWith(QueueEntry other) {
        // Cannot match with self
        if (this.userId.equals(other.userId)) {
            return false;
        }

        // Must be in the same session
        if (!this.sessionId.equals(other.sessionId)) {
            return false;
        }

        // Check proficiency level compatibility
        return isProficiencyCompatible(other.proficiencyLevel);
    }

    private boolean isProficiencyCompatible(ProficiencyLevel other) {
        if (this.proficiencyLevel == null || other == null) {
            return true; // Allow matching if proficiency not set
        }

        // Same level always matches
        if (this.proficiencyLevel == other) {
            return true;
        }

        // Adjacent levels can match
        int thisOrdinal = this.proficiencyLevel.ordinal();
        int otherOrdinal = other.ordinal();

        return Math.abs(thisOrdinal - otherOrdinal) <= 1;
    }
}
