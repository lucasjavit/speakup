package com.speakup.domain.credit;

/**
 * Tipo de transação de crédito.
 */
public enum TransactionType {
    /**
     * Compra de créditos.
     */
    PURCHASE,

    /**
     * Consumo de créditos (uso em sessão/conversa).
     */
    CONSUME,

    /**
     * Reembolso de créditos.
     */
    REFUND,

    /**
     * Bônus de créditos (promoção, indicação, etc.).
     */
    BONUS
}
