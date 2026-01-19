package com.speakup.application.consent;

import com.speakup.application.consent.dto.ConsentResponse;
import com.speakup.domain.consent.ConsentRepository;
import com.speakup.domain.consent.ConsentType;
import com.speakup.domain.consent.UserConsent;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing user consents (GDPR/LGPD compliance).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final UserRepository userRepository;

    /**
     * Grant consent for a specific type of data processing.
     */
    @Transactional
    public ConsentResponse grantConsent(UUID userId, ConsentType consentType, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserConsent consent = consentRepository.findByUserIdAndConsentType(userId, consentType)
                .orElseGet(() -> UserConsent.builder()
                        .user(user)
                        .consentType(consentType)
                        .build());

        consent.grant(ipAddress, userAgent);
        consent = consentRepository.save(consent);

        log.info("User {} granted {} consent from IP {}", userId, consentType, ipAddress);
        return ConsentResponse.from(consent);
    }

    /**
     * Withdraw previously given consent.
     */
    @Transactional
    public void withdrawConsent(UUID userId, ConsentType consentType) {
        UserConsent consent = consentRepository.findByUserIdAndConsentType(userId, consentType)
                .orElseThrow(() -> new ConsentNotFoundException(userId, consentType));

        consent.withdraw();
        consentRepository.save(consent);

        log.info("User {} withdrew {} consent", userId, consentType);
    }

    /**
     * Get all consents for a user.
     */
    @Transactional(readOnly = true)
    public List<ConsentResponse> getUserConsents(UUID userId) {
        return consentRepository.findByUserId(userId).stream()
                .map(ConsentResponse::from)
                .toList();
    }

    /**
     * Check if user has active consent for a specific type.
     */
    @Transactional(readOnly = true)
    public boolean hasConsent(UUID userId, ConsentType consentType) {
        return consentRepository.existsByUserIdAndConsentTypeAndConsentedTrue(userId, consentType);
    }

    /**
     * Delete all consents for a user (used during account deletion).
     */
    @Transactional
    public void deleteAllUserConsents(UUID userId) {
        consentRepository.deleteByUserId(userId);
        log.info("Deleted all consents for user {}", userId);
    }
}
