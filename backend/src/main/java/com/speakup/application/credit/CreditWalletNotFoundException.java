package com.speakup.application.credit;

import java.util.UUID;

/**
 * Exception thrown when a credit wallet is not found.
 */
public class CreditWalletNotFoundException extends RuntimeException {

    public CreditWalletNotFoundException(UUID userId) {
        super("Credit wallet not found for user: " + userId);
    }
}
