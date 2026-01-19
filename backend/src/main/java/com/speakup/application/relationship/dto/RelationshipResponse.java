package com.speakup.application.relationship.dto;

import com.speakup.domain.relationship.RelationshipType;
import com.speakup.domain.relationship.UserRelationship;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for relationship data.
 */
@Builder
public record RelationshipResponse(
        UUID id,
        UUID userId,
        UUID targetUserId,
        RelationshipType type,
        UUID conversationId,
        Instant createdAt
) {

    public static RelationshipResponse from(UserRelationship relationship) {
        return RelationshipResponse.builder()
                .id(relationship.getId())
                .userId(relationship.getUser().getId())
                .targetUserId(relationship.getTargetUser().getId())
                .type(relationship.getType())
                .conversationId(relationship.getConversation() != null
                        ? relationship.getConversation().getId()
                        : null)
                .createdAt(relationship.getCreatedAt())
                .build();
    }
}
