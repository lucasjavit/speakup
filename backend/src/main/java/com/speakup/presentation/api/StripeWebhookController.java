package com.speakup.presentation.api;

import com.speakup.application.payment.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for Stripe webhooks.
 * This endpoint should be configured in Stripe Dashboard.
 */
@RestController
@RequestMapping("/api/v1/stripe")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Stripe Webhook", description = "Stripe webhook endpoint")
public class StripeWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/webhook")
    @Operation(summary = "Handle Stripe webhook", description = "Receives and processes Stripe webhook events")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature
    ) {
        try {
            paymentService.handleWebhook(payload, signature);
            return ResponseEntity.ok("Webhook processed");
        } catch (SignatureVerificationException e) {
            log.error("Invalid Stripe signature: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        } catch (Exception e) {
            log.error("Error processing webhook: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Webhook processing failed");
        }
    }
}
