package com.speakup.domain.credit;

import com.speakup.domain.shared.BaseEntity;
import com.speakup.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Carteira de créditos do usuário.
 * Armazena o saldo de créditos de sessão e conversa.
 */
@Entity
@Table(name = "credit_wallets", indexes = {
    @Index(name = "idx_credit_wallets_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditWallet extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "session_credits", nullable = false)
    @Builder.Default
    private int sessionCredits = 0;

    @Column(name = "conversation_credits", nullable = false)
    @Builder.Default
    private int conversationCredits = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_mode", nullable = false)
    @Builder.Default
    private BillingMode billingMode = BillingMode.SESSION;

    /**
     * Adiciona créditos de sessão.
     */
    public void addSessionCredits(int amount) {
        if (amount < 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        this.sessionCredits += amount;
    }

    /**
     * Adiciona créditos de conversa.
     */
    public void addConversationCredits(int amount) {
        if (amount < 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        this.conversationCredits += amount;
    }

    /**
     * Consome créditos de sessão.
     * @return true se havia créditos suficientes e foram consumidos
     */
    public boolean consumeSessionCredit() {
        if (sessionCredits <= 0) {
            return false;
        }
        sessionCredits--;
        return true;
    }

    /**
     * Consome créditos de conversa.
     * @return true se havia créditos suficientes e foram consumidos
     */
    public boolean consumeConversationCredit() {
        if (conversationCredits <= 0) {
            return false;
        }
        conversationCredits--;
        return true;
    }

    /**
     * Verifica se o usuário pode entrar em uma sessão.
     * Pode entrar se tiver créditos de sessão OU de conversa.
     */
    public boolean canJoinSession() {
        return sessionCredits > 0 || conversationCredits > 0;
    }

    /**
     * Verifica se o usuário pode iniciar uma conversa.
     * Pode iniciar se tiver créditos de sessão OU de conversa.
     */
    public boolean canStartConversation() {
        return sessionCredits > 0 || conversationCredits > 0;
    }

    /**
     * Retorna o saldo atual baseado no modo de cobrança.
     */
    public int getCurrentBalance() {
        return switch (billingMode) {
            case SESSION -> sessionCredits;
            case CONVERSATION -> conversationCredits;
        };
    }
}
