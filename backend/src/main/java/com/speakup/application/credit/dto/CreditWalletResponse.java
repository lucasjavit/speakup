package com.speakup.application.credit.dto;

import com.speakup.domain.credit.BillingMode;
import com.speakup.domain.credit.CreditWallet;

/**
 * Response DTO for credit wallet information.
 */
public record CreditWalletResponse(
        int sessionCredits,
        int conversationCredits,
        BillingMode billingMode,
        boolean canJoinSession
) {
    public static CreditWalletResponse from(CreditWallet wallet) {
        return new CreditWalletResponse(
                wallet.getSessionCredits(),
                wallet.getConversationCredits(),
                wallet.getBillingMode(),
                wallet.canJoinSession()
        );
    }
}
