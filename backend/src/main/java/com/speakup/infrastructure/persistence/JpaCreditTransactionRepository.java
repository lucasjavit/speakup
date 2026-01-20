package com.speakup.infrastructure.persistence;

import com.speakup.domain.credit.CreditTransaction;
import com.speakup.domain.credit.CreditTransactionRepository;
import com.speakup.domain.credit.CreditType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * JPA implementation of CreditTransactionRepository.
 * Spring Data provides the implementation automatically.
 */
@Repository
public interface JpaCreditTransactionRepository extends JpaRepository<CreditTransaction, UUID>, CreditTransactionRepository {

    @Override
    Page<CreditTransaction> findByUserId(UUID userId, Pageable pageable);

    @Override
    List<CreditTransaction> findByUserIdAndCreditType(UUID userId, CreditType creditType);

    @Override
    Page<CreditTransaction> findByUserIdAndCreditType(UUID userId, CreditType creditType, Pageable pageable);

    @Override
    long countByUserId(UUID userId);
}
