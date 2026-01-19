package com.speakup.domain.relationship;

import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.shared.BaseEntity;
import com.speakup.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a relationship between two users (favorite or block).
 * Used to track user preferences for matching and favorites.
 */
@Entity
@Table(name = "user_relationships", indexes = {
    @Index(name = "idx_relationship_user", columnList = "user_id"),
    @Index(name = "idx_relationship_target", columnList = "target_user_id"),
    @Index(name = "idx_relationship_type", columnList = "type"),
    @Index(name = "idx_relationship_user_type", columnList = "user_id, type")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_target_type", columnNames = {"user_id", "target_user_id", "type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRelationship extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false)
    private User targetUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RelationshipType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /**
     * Validate the relationship before saving.
     * @throws IllegalArgumentException if validation fails
     */
    public void validate() {
        if (user.getId().equals(targetUser.getId())) {
            throw new IllegalArgumentException("Cannot create relationship with yourself");
        }
    }
}
