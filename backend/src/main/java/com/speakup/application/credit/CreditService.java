package com.speakup.application.credit;

import com.speakup.application.credit.dto.CreditTransactionResponse;
import com.speakup.application.credit.dto.CreditWalletResponse;
import com.speakup.domain.credit.BillingMode;
import com.speakup.domain.credit.CreditTransaction;
import com.speakup.domain.credit.CreditTransactionRepository;
import com.speakup.domain.credit.CreditType;
import com.speakup.domain.credit.CreditWallet;
import com.speakup.domain.credit.CreditWalletRepository;
import com.speakup.domain.settings.ApplicationSettingRepository;
import com.speakup.domain.settings.SettingKey;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Application service for credit-related operations.
 * Manages user credit wallets, transactions, and credit consumption.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CreditService {

    private final CreditWalletRepository walletRepository;
    private final CreditTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ApplicationSettingRepository settingRepository;

    /**
     * Get user's credit wallet, creating one if it doesn't exist.
     */
    @Transactional
    public CreditWalletResponse getOrCreateWallet(UUID userId) {
        CreditWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));
        return CreditWalletResponse.from(wallet);
    }

    /**
     * Get user's credit wallet without creating.
     */
    public CreditWalletResponse getWallet(UUID userId) {
        CreditWallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new CreditWalletNotFoundException(userId));
        return CreditWalletResponse.from(wallet);
    }

    /**
     * Create a new wallet for a user.
     */
    private CreditWallet createWallet(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        CreditWallet wallet = CreditWallet.builder()
                .user(user)
                .sessionCredits(0)
                .conversationCredits(0)
                .billingMode(BillingMode.SESSION)
                .build();

        log.info("Created credit wallet for user {}", userId);
        return walletRepository.save(wallet);
    }

    /**
     * Add credits to user's wallet after a purchase.
     */
    @Transactional
    public CreditWalletResponse addCredits(UUID userId, CreditType creditType, int amount, String description, String referenceId) {
        CreditWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));

        int balanceAfter;
        if (creditType == CreditType.SESSION) {
            wallet.addSessionCredits(amount);
            balanceAfter = wallet.getSessionCredits();
        } else {
            wallet.addConversationCredits(amount);
            balanceAfter = wallet.getConversationCredits();
        }

        walletRepository.save(wallet);

        // Record transaction
        CreditTransaction transaction = CreditTransaction.purchase(
                wallet.getUser(),
                creditType,
                amount,
                balanceAfter,
                referenceId
        );
        transactionRepository.save(transaction);

        log.info("Added {} {} credits to user {}. New balance: {}", amount, creditType, userId, balanceAfter);
        return CreditWalletResponse.from(wallet);
    }

    /**
     * Add bonus credits to user's wallet.
     */
    @Transactional
    public CreditWalletResponse addBonusCredits(UUID userId, CreditType creditType, int amount, String reason) {
        CreditWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));

        int balanceAfter;
        if (creditType == CreditType.SESSION) {
            wallet.addSessionCredits(amount);
            balanceAfter = wallet.getSessionCredits();
        } else {
            wallet.addConversationCredits(amount);
            balanceAfter = wallet.getConversationCredits();
        }

        walletRepository.save(wallet);

        // Record transaction
        CreditTransaction transaction = CreditTransaction.bonus(
                wallet.getUser(),
                creditType,
                amount,
                balanceAfter,
                reason
        );
        transactionRepository.save(transaction);

        log.info("Added {} bonus {} credits to user {}. Reason: {}", amount, creditType, userId, reason);
        return CreditWalletResponse.from(wallet);
    }

    /**
     * Consume 1 conversation credit when a conversation completes successfully.
     * Only consumes if the conversation lasted at least 2 minutes.
     *
     * @param userId the user ID
     * @param conversationId the conversation ID for reference
     * @return true if credit was consumed or skipped (free mode), false if insufficient balance
     */
    @Transactional
    public boolean consumeConversation(UUID userId, String conversationId) {
        // Free mode - no consumption
        if (isFreeModeEnabled()) {
            log.debug("Free mode enabled - skipping conversation credit consumption for user {}", userId);
            return true;
        }

        CreditWallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new CreditWalletNotFoundException(userId));

        if (!wallet.consumeConversationCredit()) {
            log.warn("User {} has insufficient conversation credits", userId);
            return false;
        }

        walletRepository.save(wallet);

        CreditTransaction transaction = CreditTransaction.consume(
                wallet.getUser(),
                CreditType.CONVERSATION,
                wallet.getConversationCredits(),
                conversationId,
                "Conversa concluída"
        );
        transactionRepository.save(transaction);

        log.info("User {} consumed 1 CONVERSATION credit. Remaining: {}", userId, wallet.getConversationCredits());
        return true;
    }

    /**
     * Check if free mode is enabled (no credits required).
     */
    public boolean isFreeModeEnabled() {
        return settingRepository.findByKey(SettingKey.FREE_MODE_ENABLED)
                .map(setting -> "true".equalsIgnoreCase(setting.getValue()))
                .orElse(false);
    }

    /**
     * Check if user has credits to join a session.
     * Returns true if free mode is enabled or user has sufficient credits.
     */
    public boolean hasCreditsForSession(UUID userId) {
        // Free mode bypasses credit check
        if (isFreeModeEnabled()) {
            return true;
        }

        return walletRepository.findByUserId(userId)
                .map(CreditWallet::canJoinSession)
                .orElse(false);
    }

    /**
     * Check if user has credits for a conversation.
     * Returns true if free mode is enabled or user has sufficient credits.
     */
    public boolean hasCreditsForConversation(UUID userId) {
        // Free mode bypasses credit check
        if (isFreeModeEnabled()) {
            return true;
        }

        return walletRepository.findByUserId(userId)
                .map(CreditWallet::canStartConversation)
                .orElse(false);
    }

    /**
     * Get transaction history for a user.
     */
    public Page<CreditTransactionResponse> getTransactionHistory(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable)
                .map(CreditTransactionResponse::from);
    }

    /**
     * Get transaction history filtered by credit type.
     */
    public Page<CreditTransactionResponse> getTransactionHistory(UUID userId, CreditType creditType, Pageable pageable) {
        return transactionRepository.findByUserIdAndCreditType(userId, creditType, pageable)
                .map(CreditTransactionResponse::from);
    }

    /**
     * Change user's billing mode.
     */
    @Transactional
    public CreditWalletResponse setBillingMode(UUID userId, BillingMode billingMode) {
        CreditWallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> createWallet(userId));

        wallet.setBillingMode(billingMode);
        walletRepository.save(wallet);

        log.info("User {} changed billing mode to {}", userId, billingMode);
        return CreditWalletResponse.from(wallet);
    }

    /**
     * Refund credits to user.
     */
    @Transactional
    public CreditWalletResponse refundCredits(UUID userId, CreditType creditType, int amount, String referenceId) {
        CreditWallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new CreditWalletNotFoundException(userId));

        int balanceAfter;
        if (creditType == CreditType.SESSION) {
            wallet.addSessionCredits(amount);
            balanceAfter = wallet.getSessionCredits();
        } else {
            wallet.addConversationCredits(amount);
            balanceAfter = wallet.getConversationCredits();
        }

        walletRepository.save(wallet);

        // Record transaction
        CreditTransaction transaction = CreditTransaction.refund(
                wallet.getUser(),
                creditType,
                amount,
                balanceAfter,
                referenceId
        );
        transactionRepository.save(transaction);

        log.info("Refunded {} {} credits to user {}", amount, creditType, userId);
        return CreditWalletResponse.from(wallet);
    }
}
