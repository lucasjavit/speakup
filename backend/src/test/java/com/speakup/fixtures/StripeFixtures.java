package com.speakup.fixtures;

import com.speakup.domain.credit.ProductType;
import com.speakup.domain.credit.Purchase;
import com.speakup.domain.user.AuthProvider;
import com.speakup.domain.user.User;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.checkout.Session;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

/**
 * Test fixtures for Stripe-related unit tests.
 * Provides factory methods for creating mock Stripe objects.
 * Uses lenient stubbing to avoid UnnecessaryStubbingException in shared fixtures.
 */
public final class StripeFixtures {

    private StripeFixtures() {
        // Utility class
    }

    // ==================== Session Fixtures ====================

    /**
     * Creates a mock Stripe Session with the given parameters.
     */
    public static Session createMockSession(String sessionId, String url) {
        Session session = mock(Session.class);
        lenient().when(session.getId()).thenReturn(sessionId);
        lenient().when(session.getUrl()).thenReturn(url);
        return session;
    }

    /**
     * Creates a mock Stripe Session with payment status.
     */
    public static Session createMockSession(String sessionId, String paymentIntentId,
                                            String paymentStatus, String sessionStatus) {
        Session session = mock(Session.class);
        lenient().when(session.getId()).thenReturn(sessionId);
        lenient().when(session.getPaymentIntent()).thenReturn(paymentIntentId);
        lenient().when(session.getPaymentStatus()).thenReturn(paymentStatus);
        lenient().when(session.getStatus()).thenReturn(sessionStatus);
        return session;
    }

    /**
     * Creates a paid Session mock.
     */
    public static Session createPaidSession(String sessionId) {
        return createMockSession(sessionId, "pi_test_" + sessionId, "paid", "complete");
    }

    /**
     * Creates an unpaid/expired Session mock.
     */
    public static Session createExpiredSession(String sessionId) {
        return createMockSession(sessionId, null, "unpaid", "expired");
    }

    // ==================== Event Fixtures ====================

    /**
     * Creates a mock checkout.session.completed Event.
     */
    public static Event createCheckoutCompletedEvent(String sessionId, String paymentIntentId) {
        Event event = mock(Event.class);
        lenient().when(event.getType()).thenReturn("checkout.session.completed");

        Session session = mock(Session.class);
        lenient().when(session.getId()).thenReturn(sessionId);
        lenient().when(session.getPaymentIntent()).thenReturn(paymentIntentId);

        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        lenient().when(deserializer.getObject()).thenReturn(Optional.of(session));
        lenient().when(event.getDataObjectDeserializer()).thenReturn(deserializer);

        return event;
    }

    /**
     * Creates a mock checkout.session.expired Event.
     */
    public static Event createCheckoutExpiredEvent(String sessionId) {
        Event event = mock(Event.class);
        lenient().when(event.getType()).thenReturn("checkout.session.expired");

        Session session = mock(Session.class);
        lenient().when(session.getId()).thenReturn(sessionId);

        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        lenient().when(deserializer.getObject()).thenReturn(Optional.of(session));
        lenient().when(event.getDataObjectDeserializer()).thenReturn(deserializer);

        return event;
    }

    /**
     * Creates a mock Event with unknown type.
     */
    public static Event createUnknownEvent(String eventType) {
        Event event = mock(Event.class);
        lenient().when(event.getType()).thenReturn(eventType);
        return event;
    }

    /**
     * Creates an Event that fails to deserialize.
     */
    public static Event createEventWithDeserializationFailure(String eventType) {
        Event event = mock(Event.class);
        lenient().when(event.getType()).thenReturn(eventType);

        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        lenient().when(deserializer.getObject()).thenReturn(Optional.empty());
        lenient().when(event.getDataObjectDeserializer()).thenReturn(deserializer);

        return event;
    }

    // ==================== User Fixtures ====================

    /**
     * Creates a test User with reflection to set the ID (since BaseEntity.id has no setter).
     */
    public static User createUser(UUID userId, String email) {
        User user = User.builder()
                .email(email)
                .name("Test User")
                .provider(AuthProvider.GOOGLE)
                .providerId("google_" + userId.toString())
                .build();
        // Use reflection to set the ID since BaseEntity doesn't expose a setter
        ReflectionTestUtils.setField(user, "id", userId);
        return user;
    }

    /**
     * Creates a test User with default email.
     */
    public static User createUser(UUID userId) {
        return createUser(userId, "test@example.com");
    }

    // ==================== Purchase Fixtures ====================

    /**
     * Creates a pending Purchase with a generated ID.
     */
    public static Purchase createPendingPurchase(User user, ProductType productType, String stripeSessionId) {
        Purchase purchase = Purchase.create(user, productType);
        purchase.setId(UUID.randomUUID()); // Set ID for testing (Purchase has its own id field)
        purchase.setStripeSessionId(stripeSessionId);
        return purchase;
    }

    /**
     * Creates a completed Purchase.
     */
    public static Purchase createCompletedPurchase(User user, ProductType productType,
                                                   String stripeSessionId, String paymentIntentId) {
        Purchase purchase = createPendingPurchase(user, productType, stripeSessionId);
        purchase.complete(paymentIntentId);
        return purchase;
    }

    /**
     * Creates a failed Purchase.
     */
    public static Purchase createFailedPurchase(User user, ProductType productType, String stripeSessionId) {
        Purchase purchase = createPendingPurchase(user, productType, stripeSessionId);
        purchase.fail();
        return purchase;
    }

    // ==================== Webhook Payload Fixtures ====================

    /**
     * Sample webhook payload JSON for checkout.session.completed.
     */
    public static String checkoutCompletedPayload(String sessionId, String paymentIntentId) {
        return """
            {
                "id": "evt_test_123",
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "%s",
                        "object": "checkout.session",
                        "payment_intent": "%s",
                        "payment_status": "paid",
                        "status": "complete"
                    }
                }
            }
            """.formatted(sessionId, paymentIntentId);
    }

    /**
     * Sample webhook payload JSON for checkout.session.expired.
     */
    public static String checkoutExpiredPayload(String sessionId) {
        return """
            {
                "id": "evt_test_456",
                "type": "checkout.session.expired",
                "data": {
                    "object": {
                        "id": "%s",
                        "object": "checkout.session",
                        "payment_status": "unpaid",
                        "status": "expired"
                    }
                }
            }
            """.formatted(sessionId);
    }

    // ==================== Constants ====================

    public static final String TEST_SESSION_ID = "cs_test_abc123";
    public static final String TEST_PAYMENT_INTENT_ID = "pi_test_def456";
    public static final String TEST_WEBHOOK_SECRET = "whsec_test_secret";
    public static final String TEST_CHECKOUT_URL = "https://checkout.stripe.com/pay/cs_test_abc123";
    public static final String VALID_SIGNATURE = "t=1234567890,v1=valid_signature";
    public static final String INVALID_SIGNATURE = "t=1234567890,v1=invalid_signature";
}
