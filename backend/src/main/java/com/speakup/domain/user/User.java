package com.speakup.domain.user;

import com.speakup.domain.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * User entity representing a platform user.
 * Contains profile information, language preferences, and proficiency level.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_provider_id", columnList = "providerId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider;

    @Column(nullable = false)
    private String providerId;

    @Enumerated(EnumType.STRING)
    private Language nativeLanguage;

    @Enumerated(EnumType.STRING)
    private Language targetLanguage;

    @Enumerated(EnumType.STRING)
    private ProficiencyLevel proficiencyLevel;

    private String timezone;

    @Column(nullable = false)
    @Builder.Default
    private boolean profileCompleted = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    /**
     * Mark profile as completed when all required fields are filled.
     */
    public void completeProfile(Language nativeLanguage, Language targetLanguage,
                                ProficiencyLevel level, String timezone) {
        this.nativeLanguage = nativeLanguage;
        this.targetLanguage = targetLanguage;
        this.proficiencyLevel = level;
        this.timezone = timezone;
        this.profileCompleted = true;
    }

    /**
     * Deactivate user account.
     */
    public void deactivate() {
        this.active = false;
    }

    /**
     * Reactivate user account.
     */
    public void activate() {
        this.active = true;
    }
}
