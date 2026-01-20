package com.speakup.presentation.api;

import com.speakup.application.payment.PaymentService;
import com.speakup.fixtures.StripeFixtures;
import com.stripe.exception.SignatureVerificationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for StripeWebhookController.
 *
 * Tests controller logic without Spring context using plain Mockito.
 * This approach is faster and more focused on unit testing the controller behavior.
 *
 * Best practices applied:
 * - Uses @ExtendWith(MockitoExtension.class) for lightweight mocking
 * - Tests all HTTP response scenarios
 * - Verifies correct status codes and response bodies
 * - Each test focuses on a single behavior
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StripeWebhookController")
class StripeWebhookControllerTest {

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private StripeWebhookController controller;

    private String validPayload;
    private String validSignature;

    @BeforeEach
    void setUp() {
        validPayload = StripeFixtures.checkoutCompletedPayload(
                StripeFixtures.TEST_SESSION_ID,
                StripeFixtures.TEST_PAYMENT_INTENT_ID
        );
        validSignature = StripeFixtures.VALID_SIGNATURE;
    }

    @Nested
    @DisplayName("handleWebhook()")
    class HandleWebhookTests {

        @Test
        @DisplayName("should return 200 OK when webhook is processed successfully")
        void shouldReturn200WhenWebhookProcessedSuccessfully() throws SignatureVerificationException {
            // Arrange
            doNothing().when(paymentService).handleWebhook(validPayload, validSignature);

            // Act
            ResponseEntity<String> response = controller.handleWebhook(validPayload, validSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo("Webhook processed");
            verify(paymentService).handleWebhook(validPayload, validSignature);
        }

        @Test
        @DisplayName("should return 400 Bad Request when signature is invalid")
        void shouldReturn400WhenSignatureInvalid() throws SignatureVerificationException {
            // Arrange
            String invalidSignature = StripeFixtures.INVALID_SIGNATURE;
            doThrow(new SignatureVerificationException("Invalid signature", null))
                    .when(paymentService).handleWebhook(validPayload, invalidSignature);

            // Act
            ResponseEntity<String> response = controller.handleWebhook(validPayload, invalidSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isEqualTo("Invalid signature");
        }

        @Test
        @DisplayName("should return 500 Internal Server Error when processing fails")
        void shouldReturn500WhenProcessingFails() throws SignatureVerificationException {
            // Arrange
            doThrow(new RuntimeException("Database error"))
                    .when(paymentService).handleWebhook(validPayload, validSignature);

            // Act
            ResponseEntity<String> response = controller.handleWebhook(validPayload, validSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isEqualTo("Webhook processing failed");
        }

        @Test
        @DisplayName("should pass exact payload and signature to service")
        void shouldPassExactPayloadAndSignatureToService() throws SignatureVerificationException {
            // Arrange
            String expectedPayload = "{\"type\":\"checkout.session.completed\"}";
            String expectedSignature = "t=1234567890,v1=abc123";
            doNothing().when(paymentService).handleWebhook(anyString(), anyString());

            // Act
            controller.handleWebhook(expectedPayload, expectedSignature);

            // Assert - verify exact values passed to service
            verify(paymentService).handleWebhook(eq(expectedPayload), eq(expectedSignature));
        }

        @Test
        @DisplayName("should handle checkout.session.completed event")
        void shouldHandleCheckoutCompletedEvent() throws SignatureVerificationException {
            // Arrange
            String payload = StripeFixtures.checkoutCompletedPayload("cs_123", "pi_456");
            doNothing().when(paymentService).handleWebhook(payload, validSignature);

            // Act
            ResponseEntity<String> response = controller.handleWebhook(payload, validSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(paymentService).handleWebhook(payload, validSignature);
        }

        @Test
        @DisplayName("should handle checkout.session.expired event")
        void shouldHandleCheckoutExpiredEvent() throws SignatureVerificationException {
            // Arrange
            String payload = StripeFixtures.checkoutExpiredPayload("cs_expired_123");
            doNothing().when(paymentService).handleWebhook(payload, validSignature);

            // Act
            ResponseEntity<String> response = controller.handleWebhook(payload, validSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(paymentService).handleWebhook(payload, validSignature);
        }

        @Test
        @DisplayName("should handle empty payload gracefully")
        void shouldHandleEmptyPayloadGracefully() throws SignatureVerificationException {
            // Arrange
            String emptyPayload = "";
            doThrow(new RuntimeException("Empty payload"))
                    .when(paymentService).handleWebhook(emptyPayload, validSignature);

            // Act
            ResponseEntity<String> response = controller.handleWebhook(emptyPayload, validSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        @Test
        @DisplayName("should handle SignatureVerificationException with specific message")
        void shouldHandleSignatureExceptionWithMessage() throws SignatureVerificationException {
            // Arrange
            doThrow(new SignatureVerificationException("Timestamp outside tolerance", null))
                    .when(paymentService).handleWebhook(anyString(), anyString());

            // Act
            ResponseEntity<String> response = controller.handleWebhook(validPayload, validSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isEqualTo("Invalid signature");
        }

        @Test
        @DisplayName("should handle NullPointerException as internal error")
        void shouldHandleNullPointerExceptionAsInternalError() throws SignatureVerificationException {
            // Arrange
            doThrow(new NullPointerException("Unexpected null"))
                    .when(paymentService).handleWebhook(anyString(), anyString());

            // Act
            ResponseEntity<String> response = controller.handleWebhook(validPayload, validSignature);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody()).isEqualTo("Webhook processing failed");
        }
    }
}
