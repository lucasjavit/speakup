package com.speakup.domain.credit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for CreditTransaction domain operations.
 * Follows Repository pattern - implementation in infrastructure layer.
 */
public interface CreditTransactionRepository {

    Optional<CreditTransaction> findById(UUID id);

    CreditTransaction save(CreditTransaction transaction);

    Page<CreditTransaction> findByUserId(UUID userId, Pageable pageable);

    List<CreditTransaction> findByUserIdAndCreditType(UUID userId, CreditType creditType);

    Page<CreditTransaction> findByUserIdAndCreditType(UUID userId, CreditType creditType, Pageable pageable);

    long countByUserId(UUID userId);
}
