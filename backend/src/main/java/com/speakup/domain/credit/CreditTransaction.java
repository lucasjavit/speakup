package com.speakup.domain.credit;

import com.speakup.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;

import java.time.Instant;
import java.util.UUID;

/**
 * Registro de transação de crédito.
 * Histórico de todas as movimentações de crédito do usuário.
 */
@Entity
@Table(name = "credit_transactions", indexes = {
    @Index(name = "idx_credit_transactions_user", columnList = "user_id"),
    @Index(name = "idx_credit_transactions_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "credit_type", nullable = false)
    private CreditType creditType;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(nullable = false)
    private int amount;

    @Column(name = "balance_after", nullable = false)
    private int balanceAfter;

    private String description;

    @Column(name = "reference_id")
    private String referenceId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /**
     * Cria uma transação de compra.
     */
    public static CreditTransaction purchase(User user, CreditType creditType, int amount, int balanceAfter, String purchaseId) {
        return CreditTransaction.builder()
            .user(user)
            .creditType(creditType)
            .transactionType(TransactionType.PURCHASE)
            .amount(amount)
            .balanceAfter(balanceAfter)
            .description("Compra de " + amount + " créditos")
            .referenceId(purchaseId)
            .build();
    }

    /**
     * Cria uma transação de consumo.
     */
    public static CreditTransaction consume(User user, CreditType creditType, int balanceAfter, String referenceId, String description) {
        return CreditTransaction.builder()
            .user(user)
            .creditType(creditType)
            .transactionType(TransactionType.CONSUME)
            .amount(-1)
            .balanceAfter(balanceAfter)
            .description(description)
            .referenceId(referenceId)
            .build();
    }

    /**
     * Cria uma transação de reembolso.
     */
    public static CreditTransaction refund(User user, CreditType creditType, int amount, int balanceAfter, String referenceId) {
        return CreditTransaction.builder()
            .user(user)
            .creditType(creditType)
            .transactionType(TransactionType.REFUND)
            .amount(amount)
            .balanceAfter(balanceAfter)
            .description("Reembolso de " + amount + " créditos")
            .referenceId(referenceId)
            .build();
    }

    /**
     * Cria uma transação de bônus.
     */
    public static CreditTransaction bonus(User user, CreditType creditType, int amount, int balanceAfter, String reason) {
        return CreditTransaction.builder()
            .user(user)
            .creditType(creditType)
            .transactionType(TransactionType.BONUS)
            .amount(amount)
            .balanceAfter(balanceAfter)
            .description("Bônus: " + reason)
            .build();
    }
}
