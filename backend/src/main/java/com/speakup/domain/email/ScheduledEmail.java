package com.speakup.domain.email;

import com.speakup.domain.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "scheduled_emails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledEmail extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ScheduledEmailStatus status = ScheduledEmailStatus.PENDING;

    @Column(nullable = false)
    private Instant scheduledAt;

    private Instant sentAt;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String recipientType = "ALL";

    @Column(columnDefinition = "TEXT")
    private String userIds;

    @Builder.Default
    private Integer recipientCount = 0;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;
}
