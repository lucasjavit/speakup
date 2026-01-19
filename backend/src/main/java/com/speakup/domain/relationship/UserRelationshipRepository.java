package com.speakup.domain.relationship;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for UserRelationship entity.
 */
public interface UserRelationshipRepository {

    UserRelationship save(UserRelationship relationship);

    Optional<UserRelationship> findById(UUID id);

    /**
     * Check if a relationship exists between two users of a specific type.
     */
    boolean existsByUserIdAndTargetUserIdAndType(UUID userId, UUID targetUserId, RelationshipType type);

    /**
     * Find a specific relationship between two users.
     */
    Optional<UserRelationship> findByUserIdAndTargetUserIdAndType(UUID userId, UUID targetUserId, RelationshipType type);

    /**
     * Find all relationships of a specific type for a user.
     */
    List<UserRelationship> findByUserIdAndType(UUID userId, RelationshipType type);

    /**
     * Get all user IDs that a user has blocked.
     */
    List<UUID> findBlockedUserIds(UUID userId);

    /**
     * Get all user IDs that have blocked a specific user.
     */
    List<UUID> findUserIdsThatBlocked(UUID userId);

    /**
     * Check if either user has blocked the other.
     */
    boolean isBlockedEitherDirection(UUID userId1, UUID userId2);

    /**
     * Check if both users have favorited each other (mutual favorites).
     */
    boolean areMutualFavorites(UUID userId1, UUID userId2);

    /**
     * Find mutual favorites for a user (both users favorited each other).
     */
    List<UserRelationship> findMutualFavorites(UUID userId);

    /**
     * Delete a specific relationship.
     */
    void delete(UserRelationship relationship);

    /**
     * Delete by user, target, and type.
     */
    void deleteByUserIdAndTargetUserIdAndType(UUID userId, UUID targetUserId, RelationshipType type);
}
