package com.speakup.infrastructure.persistence;

import com.speakup.domain.credit.PaymentStatus;
import com.speakup.domain.credit.Purchase;
import com.speakup.domain.credit.PurchaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of PurchaseRepository.
 * Spring Data provides the implementation automatically.
 */
@Repository
public interface JpaPurchaseRepository extends JpaRepository<Purchase, UUID>, PurchaseRepository {

    @Override
    Optional<Purchase> findByStripeSessionId(String stripeSessionId);

    @Override
    Page<Purchase> findByUserId(UUID userId, Pageable pageable);

    @Override
    List<Purchase> findByUserIdAndStatus(UUID userId, PaymentStatus status);

    @Override
    Page<Purchase> findByStatus(PaymentStatus status, Pageable pageable);

    @Override
    long countByStatus(PaymentStatus status);

    @Override
    @Query("SELECT COALESCE(SUM(p.price), 0) FROM Purchase p WHERE p.status = :status AND p.createdAt BETWEEN :start AND :end")
    BigDecimal sumPriceByStatusAndCreatedAtBetween(
            @Param("status") PaymentStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Override
    @Query("SELECT COUNT(p) FROM Purchase p WHERE p.status = :status AND p.createdAt BETWEEN :start AND :end")
    long countByStatusAndCreatedAtBetween(
            @Param("status") PaymentStatus status,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Override
    @Query("SELECT p FROM Purchase p JOIN FETCH p.user ORDER BY p.createdAt DESC")
    Page<Purchase> findAll(Pageable pageable);

    @Override
    @Query("SELECT p FROM Purchase p JOIN FETCH p.user WHERE p.status IN :statuses ORDER BY p.createdAt DESC")
    Page<Purchase> findByStatusIn(@Param("statuses") List<PaymentStatus> statuses, Pageable pageable);

    @Override
    long countByUserIdAndStatus(UUID userId, PaymentStatus status);
}
