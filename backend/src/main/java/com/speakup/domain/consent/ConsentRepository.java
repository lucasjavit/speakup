package com.speakup.domain.consent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing user consent records.
 */
@Repository
public interface ConsentRepository extends JpaRepository<UserConsent, UUID> {

    /**
     * Find all consents for a specific user.
     */
    List<UserConsent> findByUserId(UUID userId);

    /**
     * Find a specific consent type for a user.
     */
    Optional<UserConsent> findByUserIdAndConsentType(UUID userId, ConsentType consentType);

    /**
     * Check if user has active consent for a specific type.
     */
    boolean existsByUserIdAndConsentTypeAndConsentedTrue(UUID userId, ConsentType consentType);

    /**
     * Delete all consents for a user (used when deleting user account).
     */
    void deleteByUserId(UUID userId);
}
