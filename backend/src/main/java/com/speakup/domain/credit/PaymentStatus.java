package com.speakup.domain.credit;

/**
 * Status de uma compra/pagamento.
 */
public enum PaymentStatus {
    /**
     * Pagamento pendente - aguardando confirmação do Stripe.
     */
    PENDING,

    /**
     * Pagamento completado com sucesso.
     */
    COMPLETED,

    /**
     * Pagamento falhou.
     */
    FAILED,

    /**
     * Pagamento reembolsado.
     */
    REFUNDED
}
