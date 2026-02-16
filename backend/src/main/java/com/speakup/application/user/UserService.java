package com.speakup.application.user;

import com.speakup.application.consent.ConsentService;
import com.speakup.application.consent.dto.ConsentResponse;
import com.speakup.application.user.dto.CompleteProfileRequest;
import com.speakup.application.user.dto.UpdateUserSettingsRequest;
import com.speakup.application.user.dto.UserDataExport;
import com.speakup.application.user.dto.UserResponse;
import com.speakup.application.user.dto.UserSettingsResponse;
import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationRepository;
import com.speakup.domain.rating.Rating;
import com.speakup.domain.rating.RatingRepository;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Application service for user-related operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final RatingRepository ratingRepository;
    private final ConsentService consentService;

    /**
     * Get user by ID.
     */
    public UserResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return UserResponse.from(user);
    }

    /**
     * Get user by email.
     */
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));
        return UserResponse.from(user);
    }

    /**
     * Complete user profile with registration info and language preferences.
     */
    @Transactional
    public UserResponse completeProfile(UUID userId, CompleteProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        user.completeProfile(
                request.idNumber(),
                request.country(),
                request.city(),
                request.address(),
                request.phoneCountryCode(),
                request.phoneNumber(),
                request.nativeLanguage(),
                request.targetLanguage(),
                request.proficiencyLevel(),
                request.timezone()
        );

        User savedUser = userRepository.save(user);
        return UserResponse.from(savedUser);
    }

    /**
     * Deactivate user account.
     */
    @Transactional
    public void deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        user.deactivate();
        userRepository.save(user);
    }

    // ==================== User Settings Methods ====================

    public UserSettingsResponse getUserSettings(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return UserSettingsResponse.from(user.getOpenaiApiKey());
    }

    @Transactional
    public UserSettingsResponse updateUserSettings(UUID userId, UpdateUserSettingsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (request.openaiApiKey() != null && !request.openaiApiKey().contains("****")) {
            user.setOpenaiApiKey(request.openaiApiKey().isBlank() ? null : request.openaiApiKey());
            userRepository.save(user);
        }

        return UserSettingsResponse.from(user.getOpenaiApiKey());
    }

    // ==================== GDPR/LGPD Methods ====================

    /**
     * Export all user data (GDPR Right to Data Portability).
     * Returns all personal data stored about the user.
     */
    public UserDataExport exportUserData(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Get user profile (with unmasked ID for own data)
        UserDataExport.UserProfileExport profile = new UserDataExport.UserProfileExport(
                user.getId().toString(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getIdNumber(),  // Unmasked - user's own data
                user.getCountry(),
                user.getCity(),
                user.getAddress(),
                user.getNativeLanguage() != null ? user.getNativeLanguage().name() : null,
                user.getTargetLanguage() != null ? user.getTargetLanguage().name() : null,
                user.getProficiencyLevel() != null ? user.getProficiencyLevel().name() : null,
                user.getTimezone(),
                user.isProfileCompleted(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );

        // Get all consents
        List<ConsentResponse> consents = consentService.getUserConsents(userId);

        // Get all conversations
        List<Conversation> conversations = conversationRepository
                .findByUserId(userId, Pageable.unpaged())
                .getContent();

        List<UserDataExport.ConversationExport> conversationExports = conversations.stream()
                .map(c -> {
                    User partner = c.getUserA().getId().equals(userId) ? c.getUserB() : c.getUserA();
                    String recordingUrl = c.getUserA().getId().equals(userId)
                            ? c.getRecordingUrlA()
                            : c.getRecordingUrlB();
                    return new UserDataExport.ConversationExport(
                            c.getId().toString(),
                            partner.getName(),
                            c.getTopic(),
                            c.getDurationSeconds(),
                            recordingUrl,
                            c.getStartedAt(),
                            c.getEndedAt()
                    );
                })
                .toList();

        // Get all ratings given by user
        List<Rating> ratings = ratingRepository.findByRaterId(userId);
        List<UserDataExport.RatingExport> ratingExports = ratings.stream()
                .map(r -> new UserDataExport.RatingExport(
                        r.getConversation().getId().toString(),
                        r.getStars(),
                        null,  // No comment field in Rating entity
                        r.isWantToTalkAgain(),
                        r.getCreatedAt()
                ))
                .toList();

        log.info("Exported data for user {}", userId);

        return new UserDataExport(
                profile,
                consents,
                conversationExports,
                ratingExports,
                Instant.now()
        );
    }

    /**
     * Delete user account and all associated data (GDPR Right to Erasure).
     * This is a hard delete - data cannot be recovered.
     */
    @Transactional
    public void deleteUserCompletely(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        log.info("Starting complete deletion for user {}", userId);

        // Delete consents (handled by CASCADE, but explicit for clarity)
        consentService.deleteAllUserConsents(userId);

        // Note: Conversations and Ratings have ON DELETE CASCADE or SET NULL
        // so they will be handled by the database when we delete the user

        // Delete the user (cascades to related data)
        userRepository.delete(user);

        log.info("Completed deletion for user {}", userId);
    }
}
