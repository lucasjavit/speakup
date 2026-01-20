package com.speakup.infrastructure.persistence;

import com.speakup.domain.credit.CreditWallet;
import com.speakup.domain.credit.CreditWalletRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of CreditWalletRepository.
 * Spring Data provides the implementation automatically.
 */
@Repository
public interface JpaCreditWalletRepository extends JpaRepository<CreditWallet, UUID>, CreditWalletRepository {

    @Override
    Optional<CreditWallet> findByUserId(UUID userId);

    @Override
    boolean existsByUserId(UUID userId);
}
