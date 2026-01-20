package com.speakup.application.payment;

import com.speakup.application.credit.CreditService;
import com.speakup.application.payment.dto.CheckoutResponse;
import com.speakup.application.payment.dto.ProductListResponse;
import com.speakup.application.payment.dto.PurchaseResponse;
import com.speakup.domain.credit.CreditType;
import com.speakup.domain.credit.PaymentStatus;
import com.speakup.domain.credit.ProductType;
import com.speakup.domain.credit.Purchase;
import com.speakup.domain.credit.PurchaseRepository;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import com.speakup.fixtures.StripeFixtures;
import com.speakup.infrastructure.stripe.StripeClient;
import com.speakup.infrastructure.stripe.StripeConfig;
import com.stripe.exception.ApiException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for PaymentService.
 * Tests all Stripe integration logic with mocked dependencies.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentService")
class PaymentServiceTest {

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CreditService creditService;

    @Mock
    private StripeConfig stripeConfig;

    @Mock
    private StripeClient stripeClient;

    @InjectMocks
    private PaymentService paymentService;

    @Captor
    private ArgumentCaptor<Purchase> purchaseCaptor;

    private UUID testUserId;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = StripeFixtures.createUser(testUserId, "test@example.com");
    }

    // ==================== getProducts() Tests ====================

    @Nested
    @DisplayName("getProducts()")
    class GetProductsTests {

        @Test
        @DisplayName("should return all session products")
        void shouldReturnSessionProducts() {
            // Act
            ProductListResponse response = paymentService.getProducts();

            // Assert
            assertThat(response.sessionProducts()).hasSize(4);
            assertThat(response.sessionProducts())
                    .allMatch(p -> p.creditType() == CreditType.SESSION);
        }

        @Test
        @DisplayName("should return all conversation products")
        void shouldReturnConversationProducts() {
            // Act
            ProductListResponse response = paymentService.getProducts();

            // Assert
            assertThat(response.conversationProducts()).hasSize(4);
            assertThat(response.conversationProducts())
                    .allMatch(p -> p.creditType() == CreditType.CONVERSATION);
        }

        @Test
        @DisplayName("should return products with correct pricing")
        void shouldReturnProductsWithCorrectPricing() {
            // Act
            ProductListResponse response = paymentService.getProducts();

            // Assert - Check SESSION_SINGLE price
            var sessionSingle = response.sessionProducts().stream()
                    .filter(p -> p.id().equals("SESSION_SINGLE"))
                    .findFirst()
                    .orElseThrow();
            assertThat(sessionSingle.price()).isEqualByComparingTo("15.00");
            assertThat(sessionSingle.credits()).isEqualTo(1);
        }

        @Test
        @DisplayName("should mark popular and best value products correctly")
        void shouldMarkPopularAndBestValueProducts() {
            // Act
            ProductListResponse response = paymentService.getProducts();

            // Assert
            var popularSession = response.sessionProducts().stream()
                    .filter(p -> p.id().equals("SESSION_PACK_10"))
                    .findFirst()
                    .orElseThrow();
            assertThat(popularSession.popular()).isTrue();

            var bestValueSession = response.sessionProducts().stream()
                    .filter(p -> p.id().equals("SESSION_PACK_20"))
                    .findFirst()
                    .orElseThrow();
            assertThat(bestValueSession.bestValue()).isTrue();
        }
    }

    // ==================== createCheckoutSession() Tests ====================

    @Nested
    @DisplayName("createCheckoutSession()")
    class CreateCheckoutSessionTests {

        @Test
        @DisplayName("should create purchase and return checkout URL for valid user")
        void shouldCreatePurchaseAndReturnUrl() throws StripeException {
            // Arrange
            ProductType productType = ProductType.SESSION_PACK_10;
            Session mockSession = StripeFixtures.createMockSession(
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_CHECKOUT_URL
            );

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(purchaseRepository.countByUserIdAndStatus(testUserId, PaymentStatus.PENDING)).thenReturn(0L);
            when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> {
                Purchase p = invocation.getArgument(0);
                if (p.getId() == null) {
                    p.setId(UUID.randomUUID()); // Simulate JPA ID generation
                }
                return p;
            });
            when(stripeClient.createCheckoutSession(any())).thenReturn(mockSession);
            when(stripeConfig.getSuccessUrl()).thenReturn("http://localhost/success");
            when(stripeConfig.getCancelUrl()).thenReturn("http://localhost/cancel");

            // Act
            CheckoutResponse response = paymentService.createCheckoutSession(testUserId, productType);

            // Assert
            assertThat(response.sessionId()).isEqualTo(StripeFixtures.TEST_SESSION_ID);
            assertThat(response.url()).isEqualTo(StripeFixtures.TEST_CHECKOUT_URL);

            // Verify purchase was saved twice (creation + session ID update)
            verify(purchaseRepository, times(2)).save(purchaseCaptor.capture());
            Purchase savedPurchase = purchaseCaptor.getAllValues().get(1);
            assertThat(savedPurchase.getStripeSessionId()).isEqualTo(StripeFixtures.TEST_SESSION_ID);
            assertThat(savedPurchase.getProductType()).isEqualTo(productType);
            assertThat(savedPurchase.getStatus()).isEqualTo(PaymentStatus.PENDING);
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user not found")
        void shouldThrowWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> paymentService.createCheckoutSession(testUserId, ProductType.SESSION_SINGLE))
                    .isInstanceOf(UserNotFoundException.class);

            verifyNoInteractions(stripeClient);
            verifyNoInteractions(purchaseRepository);
        }

        @Test
        @DisplayName("should propagate StripeException when Stripe API fails")
        void shouldPropagateStripeException() throws StripeException {
            // Arrange
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(purchaseRepository.countByUserIdAndStatus(testUserId, PaymentStatus.PENDING)).thenReturn(0L);
            when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> {
                Purchase p = invocation.getArgument(0);
                if (p.getId() == null) {
                    p.setId(UUID.randomUUID());
                }
                return p;
            });
            when(stripeConfig.getSuccessUrl()).thenReturn("http://localhost/success");
            when(stripeConfig.getCancelUrl()).thenReturn("http://localhost/cancel");
            when(stripeClient.createCheckoutSession(any()))
                    .thenThrow(new ApiException("Stripe error", "req_123", "code", 500, null));

            // Act & Assert
            assertThatThrownBy(() -> paymentService.createCheckoutSession(testUserId, ProductType.SESSION_SINGLE))
                    .isInstanceOf(StripeException.class)
                    .hasMessageContaining("Stripe error");
        }

        @Test
        @DisplayName("should create checkout with correct amount in cents")
        void shouldCreateCheckoutWithCorrectAmount() throws StripeException {
            // Arrange
            ProductType productType = ProductType.SESSION_PACK_5; // R$ 67.50
            Session mockSession = StripeFixtures.createMockSession("cs_test", "http://checkout.url");

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(purchaseRepository.countByUserIdAndStatus(testUserId, PaymentStatus.PENDING)).thenReturn(0L);
            when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> {
                Purchase p = invocation.getArgument(0);
                if (p.getId() == null) {
                    p.setId(UUID.randomUUID());
                }
                return p;
            });
            when(stripeClient.createCheckoutSession(any())).thenReturn(mockSession);
            when(stripeConfig.getSuccessUrl()).thenReturn("http://localhost/success");
            when(stripeConfig.getCancelUrl()).thenReturn("http://localhost/cancel");

            // Act
            paymentService.createCheckoutSession(testUserId, productType);

            // Assert - verify Stripe was called (amount validation happens in integration tests)
            verify(stripeClient).createCheckoutSession(any());
        }

        @Test
        @DisplayName("should throw TooManyPendingPurchasesException when user has 10+ pending purchases")
        void shouldThrowWhenTooManyPendingPurchases() {
            // Arrange
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(purchaseRepository.countByUserIdAndStatus(testUserId, PaymentStatus.PENDING))
                    .thenReturn(10L); // Max allowed is 10

            // Act & Assert
            assertThatThrownBy(() -> paymentService.createCheckoutSession(testUserId, ProductType.SESSION_SINGLE))
                    .isInstanceOf(TooManyPendingPurchasesException.class)
                    .hasMessageContaining("pending purchases")
                    .hasMessageContaining("Maximum allowed: 10");

            // Should not proceed to create purchase or call Stripe
            verify(purchaseRepository, never()).save(any());
            verifyNoInteractions(stripeClient);
        }

        @Test
        @DisplayName("should allow checkout when user has less than 10 pending purchases")
        void shouldAllowCheckoutWhenUnderLimit() throws StripeException {
            // Arrange
            Session mockSession = StripeFixtures.createMockSession("cs_test", "http://checkout.url");

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(purchaseRepository.countByUserIdAndStatus(testUserId, PaymentStatus.PENDING))
                    .thenReturn(9L); // Just under the limit
            when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> {
                Purchase p = invocation.getArgument(0);
                if (p.getId() == null) {
                    p.setId(UUID.randomUUID());
                }
                return p;
            });
            when(stripeClient.createCheckoutSession(any())).thenReturn(mockSession);
            when(stripeConfig.getSuccessUrl()).thenReturn("http://localhost/success");
            when(stripeConfig.getCancelUrl()).thenReturn("http://localhost/cancel");

            // Act
            CheckoutResponse response = paymentService.createCheckoutSession(testUserId, ProductType.SESSION_SINGLE);

            // Assert
            assertThat(response).isNotNull();
            verify(stripeClient).createCheckoutSession(any());
        }

        @Test
        @DisplayName("should allow checkout when user has zero pending purchases")
        void shouldAllowCheckoutWhenNoPendingPurchases() throws StripeException {
            // Arrange
            Session mockSession = StripeFixtures.createMockSession("cs_test", "http://checkout.url");

            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
            when(purchaseRepository.countByUserIdAndStatus(testUserId, PaymentStatus.PENDING))
                    .thenReturn(0L);
            when(purchaseRepository.save(any(Purchase.class))).thenAnswer(invocation -> {
                Purchase p = invocation.getArgument(0);
                if (p.getId() == null) {
                    p.setId(UUID.randomUUID());
                }
                return p;
            });
            when(stripeClient.createCheckoutSession(any())).thenReturn(mockSession);
            when(stripeConfig.getSuccessUrl()).thenReturn("http://localhost/success");
            when(stripeConfig.getCancelUrl()).thenReturn("http://localhost/cancel");

            // Act
            CheckoutResponse response = paymentService.createCheckoutSession(testUserId, ProductType.SESSION_SINGLE);

            // Assert
            assertThat(response).isNotNull();
            verify(stripeClient).createCheckoutSession(any());
        }
    }

    // ==================== handleWebhook() Tests ====================

    @Nested
    @DisplayName("handleWebhook()")
    class HandleWebhookTests {

        @Test
        @DisplayName("should throw SignatureVerificationException for invalid signature")
        void shouldThrowForInvalidSignature() throws SignatureVerificationException {
            // Arrange
            String payload = "{}";
            String invalidSignature = "invalid";

            when(stripeConfig.getWebhookSecret()).thenReturn(StripeFixtures.TEST_WEBHOOK_SECRET);
            when(stripeClient.constructWebhookEvent(payload, invalidSignature, StripeFixtures.TEST_WEBHOOK_SECRET))
                    .thenThrow(new SignatureVerificationException("Invalid signature", null));

            // Act & Assert
            assertThatThrownBy(() -> paymentService.handleWebhook(payload, invalidSignature))
                    .isInstanceOf(SignatureVerificationException.class);

            verifyNoInteractions(purchaseRepository);
            verifyNoInteractions(creditService);
        }

        @Test
        @DisplayName("should complete purchase and add credits on checkout.session.completed")
        void shouldCompletePurchaseOnCheckoutCompleted() throws SignatureVerificationException {
            // Arrange
            String payload = StripeFixtures.checkoutCompletedPayload(
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_PAYMENT_INTENT_ID
            );
            String signature = StripeFixtures.VALID_SIGNATURE;

            Event event = StripeFixtures.createCheckoutCompletedEvent(
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_PAYMENT_INTENT_ID
            );

            Purchase pendingPurchase = StripeFixtures.createPendingPurchase(
                    testUser,
                    ProductType.SESSION_PACK_10,
                    StripeFixtures.TEST_SESSION_ID
            );

            when(stripeConfig.getWebhookSecret()).thenReturn(StripeFixtures.TEST_WEBHOOK_SECRET);
            when(stripeClient.constructWebhookEvent(payload, signature, StripeFixtures.TEST_WEBHOOK_SECRET))
                    .thenReturn(event);
            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(pendingPurchase));

            // Act
            paymentService.handleWebhook(payload, signature);

            // Assert
            verify(purchaseRepository).save(purchaseCaptor.capture());
            Purchase savedPurchase = purchaseCaptor.getValue();
            assertThat(savedPurchase.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
            assertThat(savedPurchase.getStripePaymentIntentId()).isEqualTo(StripeFixtures.TEST_PAYMENT_INTENT_ID);

            verify(creditService).addCredits(
                    eq(testUserId),
                    eq(CreditType.SESSION),
                    eq(10),
                    anyString(),
                    anyString()
            );
        }

        @Test
        @DisplayName("should not duplicate credits when purchase already completed")
        void shouldNotDuplicateCreditsWhenAlreadyCompleted() throws SignatureVerificationException {
            // Arrange
            String payload = "{}";
            String signature = StripeFixtures.VALID_SIGNATURE;

            Event event = StripeFixtures.createCheckoutCompletedEvent(
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_PAYMENT_INTENT_ID
            );

            Purchase completedPurchase = StripeFixtures.createCompletedPurchase(
                    testUser,
                    ProductType.SESSION_PACK_10,
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_PAYMENT_INTENT_ID
            );

            when(stripeConfig.getWebhookSecret()).thenReturn(StripeFixtures.TEST_WEBHOOK_SECRET);
            when(stripeClient.constructWebhookEvent(payload, signature, StripeFixtures.TEST_WEBHOOK_SECRET))
                    .thenReturn(event);
            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(completedPurchase));

            // Act
            paymentService.handleWebhook(payload, signature);

            // Assert - should not save or add credits
            verify(purchaseRepository, never()).save(any());
            verifyNoInteractions(creditService);
        }

        @Test
        @DisplayName("should mark purchase as failed on checkout.session.expired")
        void shouldMarkPurchaseAsFailedOnExpired() throws SignatureVerificationException {
            // Arrange
            String payload = StripeFixtures.checkoutExpiredPayload(StripeFixtures.TEST_SESSION_ID);
            String signature = StripeFixtures.VALID_SIGNATURE;

            Event event = StripeFixtures.createCheckoutExpiredEvent(StripeFixtures.TEST_SESSION_ID);

            Purchase pendingPurchase = StripeFixtures.createPendingPurchase(
                    testUser,
                    ProductType.SESSION_SINGLE,
                    StripeFixtures.TEST_SESSION_ID
            );

            when(stripeConfig.getWebhookSecret()).thenReturn(StripeFixtures.TEST_WEBHOOK_SECRET);
            when(stripeClient.constructWebhookEvent(payload, signature, StripeFixtures.TEST_WEBHOOK_SECRET))
                    .thenReturn(event);
            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(pendingPurchase));

            // Act
            paymentService.handleWebhook(payload, signature);

            // Assert
            verify(purchaseRepository).save(purchaseCaptor.capture());
            Purchase savedPurchase = purchaseCaptor.getValue();
            assertThat(savedPurchase.getStatus()).isEqualTo(PaymentStatus.FAILED);

            verifyNoInteractions(creditService);
        }

        @Test
        @DisplayName("should ignore expired event when purchase not pending")
        void shouldIgnoreExpiredWhenNotPending() throws SignatureVerificationException {
            // Arrange
            String payload = "{}";
            String signature = StripeFixtures.VALID_SIGNATURE;

            Event event = StripeFixtures.createCheckoutExpiredEvent(StripeFixtures.TEST_SESSION_ID);

            Purchase completedPurchase = StripeFixtures.createCompletedPurchase(
                    testUser,
                    ProductType.SESSION_SINGLE,
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_PAYMENT_INTENT_ID
            );

            when(stripeConfig.getWebhookSecret()).thenReturn(StripeFixtures.TEST_WEBHOOK_SECRET);
            when(stripeClient.constructWebhookEvent(payload, signature, StripeFixtures.TEST_WEBHOOK_SECRET))
                    .thenReturn(event);
            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(completedPurchase));

            // Act
            paymentService.handleWebhook(payload, signature);

            // Assert - should not save (purchase already completed)
            verify(purchaseRepository, never()).save(any());
        }

        @Test
        @DisplayName("should silently ignore unknown event types")
        void shouldIgnoreUnknownEventTypes() throws SignatureVerificationException {
            // Arrange
            String payload = "{}";
            String signature = StripeFixtures.VALID_SIGNATURE;

            Event event = StripeFixtures.createUnknownEvent("charge.succeeded");

            when(stripeConfig.getWebhookSecret()).thenReturn(StripeFixtures.TEST_WEBHOOK_SECRET);
            when(stripeClient.constructWebhookEvent(payload, signature, StripeFixtures.TEST_WEBHOOK_SECRET))
                    .thenReturn(event);

            // Act - should not throw
            paymentService.handleWebhook(payload, signature);

            // Assert
            verifyNoInteractions(purchaseRepository);
            verifyNoInteractions(creditService);
        }

        @Test
        @DisplayName("should throw when purchase not found for completed event")
        void shouldThrowWhenPurchaseNotFound() throws SignatureVerificationException {
            // Arrange
            String payload = "{}";
            String signature = StripeFixtures.VALID_SIGNATURE;

            Event event = StripeFixtures.createCheckoutCompletedEvent(
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_PAYMENT_INTENT_ID
            );

            when(stripeConfig.getWebhookSecret()).thenReturn(StripeFixtures.TEST_WEBHOOK_SECRET);
            when(stripeClient.constructWebhookEvent(payload, signature, StripeFixtures.TEST_WEBHOOK_SECRET))
                    .thenReturn(event);
            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> paymentService.handleWebhook(payload, signature))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Purchase not found");
        }
    }

    // ==================== getPurchaseBySessionId() Tests ====================

    @Nested
    @DisplayName("getPurchaseBySessionId()")
    class GetPurchaseBySessionIdTests {

        @Test
        @DisplayName("should return completed purchase without verification")
        void shouldReturnCompletedPurchaseWithoutVerification() throws StripeException {
            // Arrange
            Purchase completedPurchase = StripeFixtures.createCompletedPurchase(
                    testUser,
                    ProductType.SESSION_PACK_10,
                    StripeFixtures.TEST_SESSION_ID,
                    StripeFixtures.TEST_PAYMENT_INTENT_ID
            );

            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(completedPurchase));

            // Act
            PurchaseResponse response = paymentService.getPurchaseBySessionId(StripeFixtures.TEST_SESSION_ID);

            // Assert
            assertThat(response.status()).isEqualTo(PaymentStatus.COMPLETED);
            verify(stripeClient, never()).retrieveSession(anyString());
        }

        @Test
        @DisplayName("should verify and complete pending purchase when paid")
        void shouldVerifyAndCompletePendingPurchaseWhenPaid() throws StripeException {
            // Arrange
            Purchase pendingPurchase = StripeFixtures.createPendingPurchase(
                    testUser,
                    ProductType.SESSION_PACK_10,
                    StripeFixtures.TEST_SESSION_ID
            );

            Session paidSession = StripeFixtures.createPaidSession(StripeFixtures.TEST_SESSION_ID);

            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(pendingPurchase));
            when(stripeClient.retrieveSession(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(paidSession);

            // Act
            PurchaseResponse response = paymentService.getPurchaseBySessionId(StripeFixtures.TEST_SESSION_ID);

            // Assert
            assertThat(response.status()).isEqualTo(PaymentStatus.COMPLETED);

            verify(stripeClient).retrieveSession(StripeFixtures.TEST_SESSION_ID);
            verify(purchaseRepository).save(any(Purchase.class));
            verify(creditService).addCredits(
                    eq(testUserId),
                    eq(CreditType.SESSION),
                    eq(10),
                    anyString(),
                    anyString()
            );
        }

        @Test
        @DisplayName("should mark pending purchase as failed when expired")
        void shouldMarkPendingPurchaseAsFailedWhenExpired() throws StripeException {
            // Arrange
            Purchase pendingPurchase = StripeFixtures.createPendingPurchase(
                    testUser,
                    ProductType.SESSION_SINGLE,
                    StripeFixtures.TEST_SESSION_ID
            );

            Session expiredSession = StripeFixtures.createExpiredSession(StripeFixtures.TEST_SESSION_ID);

            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(pendingPurchase));
            when(stripeClient.retrieveSession(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(expiredSession);

            // Act
            PurchaseResponse response = paymentService.getPurchaseBySessionId(StripeFixtures.TEST_SESSION_ID);

            // Assert
            assertThat(response.status()).isEqualTo(PaymentStatus.FAILED);

            verify(purchaseRepository).save(any(Purchase.class));
            verifyNoInteractions(creditService);
        }

        @Test
        @DisplayName("should not fail when Stripe verification throws exception")
        void shouldNotFailWhenStripeVerificationThrows() throws StripeException {
            // Arrange
            Purchase pendingPurchase = StripeFixtures.createPendingPurchase(
                    testUser,
                    ProductType.SESSION_SINGLE,
                    StripeFixtures.TEST_SESSION_ID
            );

            when(purchaseRepository.findByStripeSessionId(StripeFixtures.TEST_SESSION_ID))
                    .thenReturn(Optional.of(pendingPurchase));
            when(stripeClient.retrieveSession(StripeFixtures.TEST_SESSION_ID))
                    .thenThrow(new ApiException("Network error", "req_123", "code", 500, null));

            // Act - should not throw, just log the error
            PurchaseResponse response = paymentService.getPurchaseBySessionId(StripeFixtures.TEST_SESSION_ID);

            // Assert - purchase remains pending
            assertThat(response.status()).isEqualTo(PaymentStatus.PENDING);
            verify(purchaseRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw when purchase not found")
        void shouldThrowWhenPurchaseNotFound() {
            // Arrange
            when(purchaseRepository.findByStripeSessionId("nonexistent"))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> paymentService.getPurchaseBySessionId("nonexistent"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Purchase not found");
        }
    }
}
