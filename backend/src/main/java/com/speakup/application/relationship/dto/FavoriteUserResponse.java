package com.speakup.application.relationship.dto;

import com.speakup.domain.relationship.UserRelationship;
import com.speakup.domain.user.User;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for favorite user data.
 */
@Builder
public record FavoriteUserResponse(
        UUID id,
        UUID userId,
        String userName,
        String userAvatar,
        boolean isMutual,
        Instant createdAt
) {

    public static FavoriteUserResponse from(UserRelationship relationship, boolean isMutual) {
        User targetUser = relationship.getTargetUser();
        return FavoriteUserResponse.builder()
                .id(relationship.getId())
                .userId(targetUser.getId())
                .userName(targetUser.getName())
                .userAvatar(targetUser.getAvatarUrl())
                .isMutual(isMutual)
                .createdAt(relationship.getCreatedAt())
                .build();
    }
}
