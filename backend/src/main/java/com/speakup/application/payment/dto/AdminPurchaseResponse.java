package com.speakup.application.payment.dto;

import com.speakup.domain.credit.CreditType;
import com.speakup.domain.credit.PaymentStatus;
import com.speakup.domain.credit.Purchase;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for admin purchase listing with user information.
 */
public record AdminPurchaseResponse(
        UUID id,
        String userName,
        String userEmail,
        String productName,
        int creditsAmount,
        CreditType creditType,
        BigDecimal price,
        String currency,
        PaymentStatus status,
        Instant createdAt,
        Instant completedAt
) {
    public static AdminPurchaseResponse from(Purchase purchase) {
        return new AdminPurchaseResponse(
                purchase.getId(),
                purchase.getUser().getName(),
                purchase.getUser().getEmail(),
                purchase.getProductType().getDisplayName(),
                purchase.getCreditsAmount(),
                purchase.getCreditType(),
                purchase.getPrice(),
                purchase.getCurrency(),
                purchase.getStatus(),
                purchase.getCreatedAt(),
                purchase.getCompletedAt()
        );
    }
}
