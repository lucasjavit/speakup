package com.speakup.domain.credit;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for CreditWallet domain operations.
 * Follows Repository pattern - implementation in infrastructure layer.
 */
public interface CreditWalletRepository {

    Optional<CreditWallet> findById(UUID id);

    Optional<CreditWallet> findByUserId(UUID userId);

    CreditWallet save(CreditWallet wallet);

    boolean existsByUserId(UUID userId);
}
