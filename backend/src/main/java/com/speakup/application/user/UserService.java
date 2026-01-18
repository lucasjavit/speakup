package com.speakup.application.user;

import com.speakup.application.user.dto.CompleteProfileRequest;
import com.speakup.application.user.dto.UserResponse;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Application service for user-related operations.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

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
     * Complete user profile with language preferences.
     */
    @Transactional
    public UserResponse completeProfile(UUID userId, CompleteProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        user.completeProfile(
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
}
