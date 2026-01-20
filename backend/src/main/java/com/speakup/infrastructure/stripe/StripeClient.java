package com.speakup.infrastructure.stripe;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

/**
 * Interface for Stripe API operations.
 * This wrapper allows for easy mocking in unit tests.
 */
public interface StripeClient {

    /**
     * Create a Stripe Checkout Session.
     *
     * @param params the session creation parameters
     * @return the created Session
     * @throws StripeException if the API call fails
     */
    Session createCheckoutSession(SessionCreateParams params) throws StripeException;

    /**
     * Retrieve an existing Stripe Session by ID.
     *
     * @param sessionId the session ID to retrieve
     * @return the Session
     * @throws StripeException if the API call fails
     */
    Session retrieveSession(String sessionId) throws StripeException;

    /**
     * Construct and verify a webhook event from the raw payload and signature.
     *
     * @param payload the raw request body
     * @param signature the Stripe-Signature header value
     * @param webhookSecret the webhook endpoint secret
     * @return the verified Event
     * @throws SignatureVerificationException if the signature is invalid
     */
    Event constructWebhookEvent(String payload, String signature, String webhookSecret)
            throws SignatureVerificationException;
}
