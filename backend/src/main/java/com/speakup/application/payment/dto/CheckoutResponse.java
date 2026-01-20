package com.speakup.application.payment.dto;

/**
 * Response DTO for checkout session.
 */
public record CheckoutResponse(
        String sessionId,
        String url
) {
}
