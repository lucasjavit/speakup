package com.speakup.infrastructure.persistence;

import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationRepository;
import com.speakup.domain.conversation.ConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of ConversationRepository.
 */
@Repository
public interface JpaConversationRepository extends JpaRepository<Conversation, UUID>, ConversationRepository {

    @Override
    @Query("SELECT c FROM Conversation c WHERE c.userA.id = :userId OR c.userB.id = :userId ORDER BY c.createdAt DESC")
    Page<Conversation> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    @Override
    @Query("""
        SELECT c FROM Conversation c
        WHERE c.session.id = :sessionId
        AND ((c.userA.id = :userAId AND c.userB.id = :userBId)
             OR (c.userA.id = :userBId AND c.userB.id = :userAId))
        """)
    List<Conversation> findByUsersAndSession(
            @Param("userAId") UUID userAId,
            @Param("userBId") UUID userBId,
            @Param("sessionId") UUID sessionId);

    @Override
    @Query("""
        SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
        FROM Conversation c
        WHERE c.session.id = :sessionId
        AND ((c.userA.id = :userAId AND c.userB.id = :userBId)
             OR (c.userA.id = :userBId AND c.userB.id = :userAId))
        """)
    boolean existsByUsersAndSession(
            @Param("userAId") UUID userAId,
            @Param("userBId") UUID userBId,
            @Param("sessionId") UUID sessionId);

    @Override
    @Query("""
        SELECT c FROM Conversation c
        WHERE (c.userA.id = :userId OR c.userB.id = :userId)
        AND c.status = 'ACTIVE'
        """)
    Optional<Conversation> findActiveByUserId(@Param("userId") UUID userId);

    @Override
    @Query("SELECT c FROM Conversation c WHERE c.session.id = :sessionId ORDER BY c.createdAt DESC")
    List<Conversation> findBySessionId(@Param("sessionId") UUID sessionId);

    @Override
    @Query("""
        SELECT COUNT(c) FROM Conversation c
        WHERE (c.userA.id = :userId OR c.userB.id = :userId)
        AND c.status = 'COMPLETED'
        """)
    long countCompletedByUserId(@Param("userId") UUID userId);

    @Override
    @Query("""
        SELECT COALESCE(SUM(c.durationSeconds), 0) FROM Conversation c
        WHERE (c.userA.id = :userId OR c.userB.id = :userId)
        AND c.status = 'COMPLETED'
        """)
    long getTotalDurationByUserId(@Param("userId") UUID userId);

    @Override
    @Query("""
        SELECT COUNT(c) FROM Conversation c
        WHERE (c.userA.id = :userId OR c.userB.id = :userId)
        AND c.status = 'COMPLETED'
        AND c.endedAt >= :since
        """)
    long countCompletedByUserIdSince(@Param("userId") UUID userId, @Param("since") Instant since);

    @Override
    List<Conversation> findByStatus(ConversationStatus status);
}
