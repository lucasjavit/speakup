package com.speakup.domain.consent;

import com.speakup.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

import java.time.Instant;
import java.util.UUID;

/**
 * Entity representing user consent records for GDPR/LGPD compliance.
 * Tracks when users give or withdraw consent for various data processing activities.
 */
@Entity
@Table(
    name = "user_consents",
    indexes = {
        @Index(name = "idx_user_consents_user_id", columnList = "user_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "consent_type"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false)
    private ConsentType consentType;

    @Column(nullable = false)
    @Builder.Default
    private boolean consented = false;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "consented_at")
    private Instant consentedAt;

    @Column(name = "withdrawn_at")
    private Instant withdrawnAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    /**
     * Grant consent for this type of data processing.
     */
    public void grant(String ipAddress, String userAgent) {
        this.consented = true;
        this.consentedAt = Instant.now();
        this.withdrawnAt = null;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.updatedAt = Instant.now();
    }

    /**
     * Withdraw previously given consent.
     */
    public void withdraw() {
        this.consented = false;
        this.withdrawnAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Check if consent is currently active.
     */
    public boolean isActive() {
        return consented && withdrawnAt == null;
    }
}
