package com.speakup.domain.credit;

/**
 * Tipo de crédito no sistema.
 */
public enum CreditType {
    /**
     * Crédito de sessão - 1 sessão = 1 hora completa (6 conversas).
     */
    SESSION,

    /**
     * Crédito de conversa - 1 conversa = 10 minutos.
     */
    CONVERSATION
}
