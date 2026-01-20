package com.speakup.domain.credit;

/**
 * Modo de cobrança do usuário.
 */
public enum BillingMode {
    /**
     * Cobrança por sessão - 1 crédito de sessão ao entrar.
     * Mais econômico para quem pratica sessões inteiras.
     */
    SESSION,

    /**
     * Cobrança por conversa - 1 crédito de conversa a cada 10 min.
     * Mais flexível para quem entra/sai durante a sessão.
     */
    CONVERSATION
}
