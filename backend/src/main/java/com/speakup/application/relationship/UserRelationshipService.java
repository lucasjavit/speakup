package com.speakup.application.relationship;

import com.speakup.application.relationship.dto.BlockUserRequest;
import com.speakup.application.relationship.dto.FavoriteUserResponse;
import com.speakup.application.relationship.dto.RelationshipResponse;
import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationRepository;
import com.speakup.domain.relationship.RelationshipType;
import com.speakup.domain.relationship.UserRelationship;
import com.speakup.domain.relationship.UserRelationshipRepository;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing user relationships (favorites, blocks).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserRelationshipService {

    private final UserRelationshipRepository relationshipRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;

    /**
     * Block a user.
     */
    @Transactional
    public RelationshipResponse blockUser(UUID userId, BlockUserRequest request) {
        if (userId.equals(request.targetUserId())) {
            throw new IllegalArgumentException("Cannot block yourself");
        }

        // Check if already blocked
        if (relationshipRepository.existsByUserIdAndTargetUserIdAndType(
                userId, request.targetUserId(), RelationshipType.BLOCK)) {
            throw new IllegalArgumentException("User is already blocked");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        User targetUser = userRepository.findById(request.targetUserId())
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        Conversation conversation = null;
        if (request.conversationId() != null) {
            conversation = conversationRepository.findById(request.conversationId())
                    .orElse(null);
        }

        // Remove any existing favorite relationship (blocking takes precedence)
        relationshipRepository.deleteByUserIdAndTargetUserIdAndType(
                userId, request.targetUserId(), RelationshipType.FAVORITE);

        // Create block relationship
        UserRelationship block = UserRelationship.builder()
                .user(user)
                .targetUser(targetUser)
                .type(RelationshipType.BLOCK)
                .conversation(conversation)
                .build();

        block.validate();
        block = relationshipRepository.save(block);

        log.info("User {} blocked user {}", userId, request.targetUserId());

        return RelationshipResponse.from(block);
    }

    /**
     * Unblock a user.
     */
    @Transactional
    public void unblockUser(UUID userId, UUID targetUserId) {
        if (!relationshipRepository.existsByUserIdAndTargetUserIdAndType(
                userId, targetUserId, RelationshipType.BLOCK)) {
            throw new IllegalArgumentException("User is not blocked");
        }

        relationshipRepository.deleteByUserIdAndTargetUserIdAndType(
                userId, targetUserId, RelationshipType.BLOCK);

        log.info("User {} unblocked user {}", userId, targetUserId);
    }

    /**
     * Check if either user has blocked the other.
     */
    @Transactional(readOnly = true)
    public boolean isBlocked(UUID userId1, UUID userId2) {
        return relationshipRepository.isBlockedEitherDirection(userId1, userId2);
    }

    /**
     * Get all favorites for a user.
     */
    @Transactional(readOnly = true)
    public List<FavoriteUserResponse> getFavorites(UUID userId) {
        List<UserRelationship> favorites = relationshipRepository.findByUserIdAndType(
                userId, RelationshipType.FAVORITE);

        return favorites.stream()
                .map(fav -> {
                    boolean isMutual = relationshipRepository.areMutualFavorites(
                            userId, fav.getTargetUser().getId());
                    return FavoriteUserResponse.from(fav, isMutual);
                })
                .toList();
    }

    /**
     * Get mutual favorites for a user (both users favorited each other).
     */
    @Transactional(readOnly = true)
    public List<FavoriteUserResponse> getMutualFavorites(UUID userId) {
        List<UserRelationship> mutualFavorites = relationshipRepository.findMutualFavorites(userId);

        return mutualFavorites.stream()
                .map(fav -> FavoriteUserResponse.from(fav, true))
                .toList();
    }

    /**
     * Check if two users are mutual favorites.
     */
    @Transactional(readOnly = true)
    public boolean areMutualFavorites(UUID userId1, UUID userId2) {
        return relationshipRepository.areMutualFavorites(userId1, userId2);
    }

    /**
     * Get all blocked user IDs for a user.
     */
    @Transactional(readOnly = true)
    public List<UUID> getBlockedUserIds(UUID userId) {
        return relationshipRepository.findBlockedUserIds(userId);
    }

    /**
     * Get all user IDs that have blocked a specific user.
     */
    @Transactional(readOnly = true)
    public List<UUID> getUserIdsThatBlocked(UUID userId) {
        return relationshipRepository.findUserIdsThatBlocked(userId);
    }

    /**
     * Remove a favorite (unfavorite a user).
     */
    @Transactional
    public void removeFavorite(UUID userId, UUID targetUserId) {
        if (!relationshipRepository.existsByUserIdAndTargetUserIdAndType(
                userId, targetUserId, RelationshipType.FAVORITE)) {
            throw new IllegalArgumentException("User is not a favorite");
        }

        relationshipRepository.deleteByUserIdAndTargetUserIdAndType(
                userId, targetUserId, RelationshipType.FAVORITE);

        log.info("User {} removed {} from favorites", userId, targetUserId);
    }
}
