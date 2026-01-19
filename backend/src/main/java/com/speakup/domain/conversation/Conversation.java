package com.speakup.domain.conversation;

import com.speakup.domain.session.Session;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Duration;
import java.time.Instant;

/**
 * Represents a video conversation between two users.
 * Records the call details, duration, and optional audio recordings.
 */
@Entity
@Table(name = "conversations", indexes = {
    @Index(name = "idx_conversation_user_a", columnList = "user_a_id"),
    @Index(name = "idx_conversation_user_b", columnList = "user_b_id"),
    @Index(name = "idx_conversation_session", columnList = "session_id"),
    @Index(name = "idx_conversation_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_a_id", nullable = false)
    private User userA;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_b_id", nullable = false)
    private User userB;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @Column(columnDefinition = "TEXT")
    private String topic;

    private Instant startedAt;

    private Instant endedAt;

    private Integer durationSeconds;

    @Column(name = "recording_url_a", columnDefinition = "TEXT")
    private String recordingUrlA;

    @Column(name = "recording_url_b", columnDefinition = "TEXT")
    private String recordingUrlB;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.WAITING;

    /**
     * Mark conversation as active (call started).
     */
    public void start() {
        this.status = ConversationStatus.ACTIVE;
        this.startedAt = Instant.now();
    }

    /**
     * Mark conversation as completed.
     */
    public void complete() {
        this.status = ConversationStatus.COMPLETED;
        this.endedAt = Instant.now();
        calculateDuration();
    }

    /**
     * Mark conversation as cancelled.
     */
    public void cancel() {
        this.status = ConversationStatus.CANCELLED;
        this.endedAt = Instant.now();
        calculateDuration();
    }

    /**
     * Set recording URL for user A.
     */
    public void setRecordingA(String url) {
        this.recordingUrlA = url;
    }

    /**
     * Set recording URL for user B.
     */
    public void setRecordingB(String url) {
        this.recordingUrlB = url;
    }

    /**
     * Check if this conversation involves a specific user.
     */
    public boolean involvesUser(User user) {
        return userA.getId().equals(user.getId()) || userB.getId().equals(user.getId());
    }

    /**
     * Get the other user in the conversation.
     */
    public User getOtherUser(User user) {
        if (userA.getId().equals(user.getId())) {
            return userB;
        }
        if (userB.getId().equals(user.getId())) {
            return userA;
        }
        throw new IllegalArgumentException("User is not part of this conversation");
    }

    /**
     * Check if conversation is currently active.
     */
    public boolean isActive() {
        return status == ConversationStatus.ACTIVE;
    }

    /**
     * Check if conversation has ended (completed or cancelled).
     */
    public boolean hasEnded() {
        return status == ConversationStatus.COMPLETED || status == ConversationStatus.CANCELLED;
    }

    private void calculateDuration() {
        if (startedAt != null && endedAt != null) {
            this.durationSeconds = (int) Duration.between(startedAt, endedAt).toSeconds();
        }
    }
}
