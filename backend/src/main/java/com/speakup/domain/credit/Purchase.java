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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Registro de compra de créditos.
 * Armazena informações sobre a transação de pagamento.
 */
@Entity
@Table(name = "purchases", indexes = {
    @Index(name = "idx_purchases_user", columnList = "user_id"),
    @Index(name = "idx_purchases_stripe_session", columnList = "stripe_session_id"),
    @Index(name = "idx_purchases_status", columnList = "status"),
    @Index(name = "idx_purchases_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false)
    private ProductType productType;

    @Column(name = "credits_amount", nullable = false)
    private int creditsAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "credit_type", nullable = false)
    private CreditType creditType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "BRL";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "stripe_session_id")
    private String stripeSessionId;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    /**
     * Cria uma nova compra a partir de um tipo de produto.
     */
    public static Purchase create(User user, ProductType productType) {
        return Purchase.builder()
            .user(user)
            .productType(productType)
            .creditsAmount(productType.getCredits())
            .creditType(productType.getCreditType())
            .price(productType.getPrice())
            .build();
    }

    /**
     * Marca a compra como completa após confirmação do pagamento.
     */
    public void complete(String paymentIntentId) {
        this.status = PaymentStatus.COMPLETED;
        this.stripePaymentIntentId = paymentIntentId;
        this.completedAt = Instant.now();
    }

    /**
     * Marca a compra como falha.
     */
    public void fail() {
        this.status = PaymentStatus.FAILED;
    }

    /**
     * Marca a compra como reembolsada.
     */
    public void refund() {
        this.status = PaymentStatus.REFUNDED;
    }

    /**
     * Verifica se a compra foi completada com sucesso.
     */
    public boolean isCompleted() {
        return status == PaymentStatus.COMPLETED;
    }

    /**
     * Verifica se a compra está pendente.
     */
    public boolean isPending() {
        return status == PaymentStatus.PENDING;
    }
}
