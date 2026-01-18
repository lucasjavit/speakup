package com.speakup.domain.user.exception;

import com.speakup.domain.shared.DomainException;

import java.util.UUID;

/**
 * Exception thrown when a user is not found.
 */
public class UserNotFoundException extends DomainException {

    public UserNotFoundException(UUID userId) {
        super("User not found with id: " + userId);
    }

    public UserNotFoundException(String email) {
        super("User not found with email: " + email);
    }
}
