package com.speakup.domain.feedback;

import com.speakup.domain.shared.BaseEntity;
import com.speakup.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Feedback entity representing user feedback (bugs, suggestions, etc).
 */
@Entity
@Table(name = "feedbacks", indexes = {
    @Index(name = "idx_feedback_user_id", columnList = "user_id"),
    @Index(name = "idx_feedback_type", columnList = "type"),
    @Index(name = "idx_feedback_status", columnList = "status"),
    @Index(name = "idx_feedback_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "user_name", nullable = false)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FeedbackType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "screenshot_url", length = 1000)
    private String screenshotUrl;

    @Lob
    @Column(name = "screenshot_data", columnDefinition = "TEXT")
    private String screenshotData;

    @Column(name = "page_url", length = 1000)
    private String pageUrl;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private FeedbackStatus status = FeedbackStatus.OPEN;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    /**
     * Mark feedback as resolved
     */
    public void resolve(UUID adminId) {
        this.status = FeedbackStatus.RESOLVED;
        this.resolvedAt = Instant.now();
        this.resolvedBy = adminId;
    }

    /**
     * Mark feedback as closed
     */
    public void close() {
        this.status = FeedbackStatus.CLOSED;
    }

    /**
     * Update feedback status
     */
    public void updateStatus(FeedbackStatus newStatus, UUID adminId) {
        this.status = newStatus;
        if (newStatus == FeedbackStatus.RESOLVED && this.resolvedAt == null) {
            this.resolvedAt = Instant.now();
            this.resolvedBy = adminId;
        }
    }

    /**
     * Add or update admin notes
     */
    public void updateAdminNotes(String notes) {
        this.adminNotes = notes;
    }
}
