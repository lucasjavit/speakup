-- =====================================================
-- V10: Credits System for SpeakUp
-- Sistema de créditos para monetização
-- =====================================================

-- Carteira de créditos do usuário
CREATE TABLE credit_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    session_credits INT NOT NULL DEFAULT 0,
    conversation_credits INT NOT NULL DEFAULT 0,
    billing_mode VARCHAR(20) NOT NULL DEFAULT 'SESSION',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE credit_wallets IS 'Carteira de créditos do usuário';
COMMENT ON COLUMN credit_wallets.session_credits IS 'Créditos de sessão (1 sessão = 1h completa)';
COMMENT ON COLUMN credit_wallets.conversation_credits IS 'Créditos de conversa (1 conversa = 10 min)';
COMMENT ON COLUMN credit_wallets.billing_mode IS 'Modo de cobrança: SESSION ou CONVERSATION';

-- Transações de crédito (histórico)
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credit_type VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    amount INT NOT NULL,
    balance_after INT NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE credit_transactions IS 'Histórico de transações de crédito';
COMMENT ON COLUMN credit_transactions.credit_type IS 'Tipo: SESSION ou CONVERSATION';
COMMENT ON COLUMN credit_transactions.transaction_type IS 'Tipo: PURCHASE, CONSUME, REFUND, BONUS';
COMMENT ON COLUMN credit_transactions.amount IS 'Quantidade (positivo = entrada, negativo = saída)';
COMMENT ON COLUMN credit_transactions.balance_after IS 'Saldo após a transação';
COMMENT ON COLUMN credit_transactions.reference_id IS 'ID da compra ou sessão relacionada';

-- Compras
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_type VARCHAR(50) NOT NULL,
    credits_amount INT NOT NULL,
    credit_type VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE purchases IS 'Registro de compras de créditos';
COMMENT ON COLUMN purchases.product_type IS 'Tipo do produto: SESSION_SINGLE, SESSION_PACK_5, etc.';
COMMENT ON COLUMN purchases.status IS 'Status: PENDING, COMPLETED, FAILED, REFUNDED';
COMMENT ON COLUMN purchases.stripe_session_id IS 'ID da sessão de checkout do Stripe';

-- Índices
CREATE INDEX idx_credit_wallets_user ON credit_wallets(user_id);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_stripe_session ON purchases(stripe_session_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);
