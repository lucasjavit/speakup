package com.speakup.application.user.dto;

import com.speakup.application.consent.dto.ConsentResponse;

import java.time.Instant;
import java.util.List;

/**
 * DTO for exporting all user data (GDPR Right to Data Portability).
 * Contains all personal data stored about the user.
 */
public record UserDataExport(
    UserProfileExport profile,
    List<ConsentResponse> consents,
    List<ConversationExport> conversations,
    List<RatingExport> ratings,
    Instant exportedAt
) {
    /**
     * User profile data for export (includes unmasked ID for user's own data).
     */
    public record UserProfileExport(
        String id,
        String email,
        String name,
        String avatarUrl,
        String idNumber,  // Unmasked - user's own data
        String country,
        String city,
        String address,
        String nativeLanguage,
        String targetLanguage,
        String proficiencyLevel,
        String timezone,
        boolean profileCompleted,
        boolean active,
        Instant createdAt,
        Instant updatedAt
    ) {}

    /**
     * Conversation data for export.
     */
    public record ConversationExport(
        String id,
        String partnerName,
        String topic,
        Integer durationSeconds,
        String recordingUrl,
        Instant startedAt,
        Instant endedAt
    ) {}

    /**
     * Rating data for export.
     */
    public record RatingExport(
        String conversationId,
        Integer stars,
        String comment,
        boolean wantToTalkAgain,
        Instant createdAt
    ) {}
}
