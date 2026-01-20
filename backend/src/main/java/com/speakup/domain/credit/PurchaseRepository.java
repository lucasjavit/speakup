package com.speakup.domain.credit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Purchase domain operations.
 * Follows Repository pattern - implementation in infrastructure layer.
 */
public interface PurchaseRepository {

    Optional<Purchase> findById(UUID id);

    Optional<Purchase> findByStripeSessionId(String stripeSessionId);

    Purchase save(Purchase purchase);

    Page<Purchase> findByUserId(UUID userId, Pageable pageable);

    List<Purchase> findByUserIdAndStatus(UUID userId, PaymentStatus status);

    Page<Purchase> findByStatus(PaymentStatus status, Pageable pageable);

    long countByStatus(PaymentStatus status);

    BigDecimal sumPriceByStatusAndCreatedAtBetween(PaymentStatus status, Instant start, Instant end);

    long countByStatusAndCreatedAtBetween(PaymentStatus status, Instant start, Instant end);

    Page<Purchase> findAll(Pageable pageable);

    Page<Purchase> findByStatusIn(List<PaymentStatus> statuses, Pageable pageable);

    long countByUserIdAndStatus(UUID userId, PaymentStatus status);
}
