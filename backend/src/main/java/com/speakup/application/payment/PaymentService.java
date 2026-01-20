package com.speakup.application.payment;

import com.speakup.application.credit.CreditService;
import com.speakup.application.payment.dto.AdminPurchaseResponse;
import com.speakup.application.payment.dto.CheckoutResponse;
import com.speakup.application.payment.dto.ProductListResponse;
import com.speakup.application.payment.dto.ProductResponse;
import com.speakup.application.payment.dto.PurchaseResponse;
import com.speakup.domain.credit.CreditType;
import com.speakup.domain.credit.PaymentStatus;
import com.speakup.domain.credit.ProductType;
import com.speakup.domain.credit.Purchase;
import com.speakup.domain.credit.PurchaseRepository;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import com.speakup.infrastructure.stripe.StripeClient;
import com.speakup.infrastructure.stripe.StripeConfig;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Application service for payment operations.
 * Handles Stripe integration and purchase management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentService {

    private final PurchaseRepository purchaseRepository;
    private final UserRepository userRepository;
    private final CreditService creditService;
    private final StripeConfig stripeConfig;
    private final StripeClient stripeClient;

    /**
     * Get all available products grouped by type.
     */
    public ProductListResponse getProducts() {
        List<ProductResponse> sessionProducts = Arrays.stream(ProductType.values())
                .filter(p -> p.getCreditType() == CreditType.SESSION)
                .map(ProductResponse::from)
                .toList();

        List<ProductResponse> conversationProducts = Arrays.stream(ProductType.values())
                .filter(p -> p.getCreditType() == CreditType.CONVERSATION)
                .map(ProductResponse::from)
                .toList();

        return new ProductListResponse(sessionProducts, conversationProducts);
    }

    /**
     * Create a Stripe Checkout session for purchasing credits.
     * Rate limited to prevent abuse - maximum 10 pending purchases per user.
     */
    @Transactional
    public CheckoutResponse createCheckoutSession(UUID userId, ProductType productType) throws StripeException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Rate limiting: check pending purchases count
        long pendingCount = purchaseRepository.countByUserIdAndStatus(userId, PaymentStatus.PENDING);
        if (pendingCount >= TooManyPendingPurchasesException.getMaxPendingPurchases()) {
            log.warn("User {} has {} pending purchases, rejecting new checkout", userId, pendingCount);
            throw new TooManyPendingPurchasesException(userId, pendingCount);
        }

        // Create purchase record
        Purchase purchase = Purchase.create(user, productType);
        purchase = purchaseRepository.save(purchase);

        // Convert price to cents (Stripe requires amount in smallest currency unit)
        long amountInCents = productType.getPrice().multiply(BigDecimal.valueOf(100)).longValue();

        // Create Stripe Checkout Session
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setCustomerEmail(user.getEmail())
                .setSuccessUrl(stripeConfig.getSuccessUrl() + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(stripeConfig.getCancelUrl())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency("brl")
                                .setUnitAmount(amountInCents)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(productType.getDisplayName())
                                        .setDescription("SpeakUp - " + productType.getCredits() + " " +
                                                (productType.getCreditType() == CreditType.SESSION ? "Sessões" : "Conversas"))
                                        .build())
                                .build())
                        .setQuantity(1L)
                        .build())
                .putMetadata("purchase_id", purchase.getId().toString())
                .putMetadata("user_id", userId.toString())
                .putMetadata("product_type", productType.name())
                .build();

        Session session = stripeClient.createCheckoutSession(params);

        // Save Stripe session ID
        purchase.setStripeSessionId(session.getId());
        purchaseRepository.save(purchase);

        log.info("Created checkout session {} for user {} purchasing {}", session.getId(), userId, productType);
        return new CheckoutResponse(session.getId(), session.getUrl());
    }

    /**
     * Handle Stripe webhook event.
     */
    @Transactional
    public void handleWebhook(String payload, String signature) throws SignatureVerificationException {
        Event event = stripeClient.constructWebhookEvent(payload, signature, stripeConfig.getWebhookSecret());

        switch (event.getType()) {
            case "checkout.session.completed" -> handleCheckoutCompleted(event);
            case "checkout.session.expired" -> handleCheckoutExpired(event);
            default -> log.debug("Unhandled event type: {}", event.getType());
        }
    }

    /**
     * Handle successful checkout completion.
     */
    private void handleCheckoutCompleted(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize checkout session"));

        String stripeSessionId = session.getId();
        String paymentIntentId = session.getPaymentIntent();

        Purchase purchase = purchaseRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new RuntimeException("Purchase not found for session: " + stripeSessionId));

        if (purchase.isCompleted()) {
            log.warn("Purchase {} already completed, skipping", purchase.getId());
            return;
        }

        // Complete the purchase
        purchase.complete(paymentIntentId);
        purchaseRepository.save(purchase);

        // Add credits to user's wallet
        creditService.addCredits(
                purchase.getUser().getId(),
                purchase.getCreditType(),
                purchase.getCreditsAmount(),
                "Compra: " + purchase.getProductType().getDisplayName(),
                purchase.getId().toString()
        );

        log.info("Completed purchase {} - {} {} credits added to user {}",
                purchase.getId(),
                purchase.getCreditsAmount(),
                purchase.getCreditType(),
                purchase.getUser().getId());
    }

    /**
     * Handle expired checkout session.
     */
    private void handleCheckoutExpired(Event event) {
        Session session = (Session) event.getDataObjectDeserializer()
                .getObject()
                .orElseThrow(() -> new RuntimeException("Failed to deserialize checkout session"));

        String stripeSessionId = session.getId();

        purchaseRepository.findByStripeSessionId(stripeSessionId)
                .ifPresent(purchase -> {
                    if (purchase.isPending()) {
                        purchase.fail();
                        purchaseRepository.save(purchase);
                        log.info("Marked expired purchase {} as failed", purchase.getId());
                    }
                });
    }

    /**
     * Get purchase history for a user.
     */
    public Page<PurchaseResponse> getPurchaseHistory(UUID userId, Pageable pageable) {
        return purchaseRepository.findByUserId(userId, pageable)
                .map(PurchaseResponse::from);
    }

    /**
     * Get purchase by session ID (for success page verification).
     * Also verifies and completes the purchase if payment was successful.
     */
    @Transactional
    public PurchaseResponse getPurchaseBySessionId(String stripeSessionId) {
        Purchase purchase = purchaseRepository.findByStripeSessionId(stripeSessionId)
                .orElseThrow(() -> new RuntimeException("Purchase not found"));

        // If purchase is still pending, verify with Stripe and complete if paid
        if (purchase.isPending()) {
            verifyAndCompletePurchase(purchase);
        }

        return PurchaseResponse.from(purchase);
    }

    /**
     * Verify payment status with Stripe API and complete purchase if paid.
     * This is the secure way to confirm payment without relying solely on webhooks.
     */
    private void verifyAndCompletePurchase(Purchase purchase) {
        try {
            Session session = stripeClient.retrieveSession(purchase.getStripeSessionId());

            if ("paid".equals(session.getPaymentStatus())) {
                String paymentIntentId = session.getPaymentIntent();

                // Complete the purchase
                purchase.complete(paymentIntentId);
                purchaseRepository.save(purchase);

                // Add credits to user's wallet
                creditService.addCredits(
                        purchase.getUser().getId(),
                        purchase.getCreditType(),
                        purchase.getCreditsAmount(),
                        "Compra: " + purchase.getProductType().getDisplayName(),
                        purchase.getId().toString()
                );

                log.info("Verified and completed purchase {} - {} {} credits added to user {}",
                        purchase.getId(),
                        purchase.getCreditsAmount(),
                        purchase.getCreditType(),
                        purchase.getUser().getId());
            } else if ("unpaid".equals(session.getPaymentStatus()) && "expired".equals(session.getStatus())) {
                purchase.fail();
                purchaseRepository.save(purchase);
                log.info("Marked expired purchase {} as failed", purchase.getId());
            }
        } catch (StripeException e) {
            log.error("Failed to verify payment status for purchase {}: {}", purchase.getId(), e.getMessage());
        }
    }

    /**
     * Get financial stats for admin.
     */
    public FinancialStats getFinancialStats(java.time.Instant startDate, java.time.Instant endDate) {
        BigDecimal totalRevenue = purchaseRepository.sumPriceByStatusAndCreatedAtBetween(
                PaymentStatus.COMPLETED, startDate, endDate);
        long totalPurchases = purchaseRepository.countByStatusAndCreatedAtBetween(
                PaymentStatus.COMPLETED, startDate, endDate);

        return new FinancialStats(totalRevenue, totalPurchases);
    }

    /**
     * Financial statistics record.
     */
    public record FinancialStats(BigDecimal totalRevenue, long totalPurchases) {
    }

    /**
     * Get all purchases for admin panel.
     * Can filter by status if provided.
     */
    public Page<AdminPurchaseResponse> getAllPurchases(List<PaymentStatus> statuses, Pageable pageable) {
        if (statuses == null || statuses.isEmpty()) {
            return purchaseRepository.findAll(pageable)
                    .map(AdminPurchaseResponse::from);
        }
        return purchaseRepository.findByStatusIn(statuses, pageable)
                .map(AdminPurchaseResponse::from);
    }
}
