package com.speakup.application.credit.dto;

import com.speakup.domain.credit.CreditTransaction;
import com.speakup.domain.credit.CreditType;
import com.speakup.domain.credit.TransactionType;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for credit transaction information.
 */
public record CreditTransactionResponse(
        UUID id,
        CreditType creditType,
        TransactionType transactionType,
        int amount,
        int balanceAfter,
        String description,
        Instant createdAt
) {
    public static CreditTransactionResponse from(CreditTransaction transaction) {
        return new CreditTransactionResponse(
                transaction.getId(),
                transaction.getCreditType(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getBalanceAfter(),
                transaction.getDescription(),
                transaction.getCreatedAt()
        );
    }
}
