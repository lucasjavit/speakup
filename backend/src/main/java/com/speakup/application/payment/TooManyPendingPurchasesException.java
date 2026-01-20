package com.speakup.application.payment;

import java.util.UUID;

/**
 * Exception thrown when a user has too many pending purchases.
 * Used for rate limiting checkout session creation.
 */
public class TooManyPendingPurchasesException extends RuntimeException {

    private static final int MAX_PENDING_PURCHASES = 10;

    public TooManyPendingPurchasesException(UUID userId) {
        super("User " + userId + " has too many pending purchases. Maximum allowed: " + MAX_PENDING_PURCHASES);
    }

    public TooManyPendingPurchasesException(UUID userId, long currentCount) {
        super("User " + userId + " has " + currentCount + " pending purchases. Maximum allowed: " + MAX_PENDING_PURCHASES);
    }

    public static int getMaxPendingPurchases() {
        return MAX_PENDING_PURCHASES;
    }
}
