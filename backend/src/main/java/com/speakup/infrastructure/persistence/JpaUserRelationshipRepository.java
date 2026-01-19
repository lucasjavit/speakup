package com.speakup.infrastructure.persistence;

import com.speakup.domain.relationship.RelationshipType;
import com.speakup.domain.relationship.UserRelationship;
import com.speakup.domain.relationship.UserRelationshipRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of UserRelationshipRepository.
 */
@Repository
public interface JpaUserRelationshipRepository extends JpaRepository<UserRelationship, UUID>, UserRelationshipRepository {

    @Override
    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM UserRelationship r
        WHERE r.user.id = :userId AND r.targetUser.id = :targetUserId AND r.type = :type
        """)
    boolean existsByUserIdAndTargetUserIdAndType(
            @Param("userId") UUID userId,
            @Param("targetUserId") UUID targetUserId,
            @Param("type") RelationshipType type);

    @Override
    @Query("""
        SELECT r FROM UserRelationship r
        WHERE r.user.id = :userId AND r.targetUser.id = :targetUserId AND r.type = :type
        """)
    Optional<UserRelationship> findByUserIdAndTargetUserIdAndType(
            @Param("userId") UUID userId,
            @Param("targetUserId") UUID targetUserId,
            @Param("type") RelationshipType type);

    @Override
    @Query("SELECT r FROM UserRelationship r WHERE r.user.id = :userId AND r.type = :type ORDER BY r.createdAt DESC")
    List<UserRelationship> findByUserIdAndType(
            @Param("userId") UUID userId,
            @Param("type") RelationshipType type);

    @Override
    @Query("SELECT r.targetUser.id FROM UserRelationship r WHERE r.user.id = :userId AND r.type = 'BLOCK'")
    List<UUID> findBlockedUserIds(@Param("userId") UUID userId);

    @Override
    @Query("SELECT r.user.id FROM UserRelationship r WHERE r.targetUser.id = :userId AND r.type = 'BLOCK'")
    List<UUID> findUserIdsThatBlocked(@Param("userId") UUID userId);

    @Override
    @Query("""
        SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
        FROM UserRelationship r
        WHERE r.type = 'BLOCK'
        AND ((r.user.id = :userId1 AND r.targetUser.id = :userId2)
             OR (r.user.id = :userId2 AND r.targetUser.id = :userId1))
        """)
    boolean isBlockedEitherDirection(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2);

    @Override
    @Query("""
        SELECT CASE WHEN COUNT(r) = 2 THEN true ELSE false END
        FROM UserRelationship r
        WHERE r.type = 'FAVORITE'
        AND ((r.user.id = :userId1 AND r.targetUser.id = :userId2)
             OR (r.user.id = :userId2 AND r.targetUser.id = :userId1))
        """)
    boolean areMutualFavorites(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2);

    @Override
    @Query("""
        SELECT r FROM UserRelationship r
        WHERE r.user.id = :userId AND r.type = 'FAVORITE'
        AND EXISTS (
            SELECT 1 FROM UserRelationship r2
            WHERE r2.user.id = r.targetUser.id
            AND r2.targetUser.id = :userId
            AND r2.type = 'FAVORITE'
        )
        ORDER BY r.createdAt DESC
        """)
    List<UserRelationship> findMutualFavorites(@Param("userId") UUID userId);

    @Override
    @Modifying
    @Query("""
        DELETE FROM UserRelationship r
        WHERE r.user.id = :userId AND r.targetUser.id = :targetUserId AND r.type = :type
        """)
    void deleteByUserIdAndTargetUserIdAndType(
            @Param("userId") UUID userId,
            @Param("targetUserId") UUID targetUserId,
            @Param("type") RelationshipType type);
}
