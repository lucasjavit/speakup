package com.speakup.infrastructure.stripe;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.stereotype.Component;

/**
 * Implementation of StripeClient that calls the actual Stripe SDK.
 * This wrapper enables easy mocking in unit tests.
 */
@Component
public class StripeClientImpl implements StripeClient {

    @Override
    public Session createCheckoutSession(SessionCreateParams params) throws StripeException {
        return Session.create(params);
    }

    @Override
    public Session retrieveSession(String sessionId) throws StripeException {
        return Session.retrieve(sessionId);
    }

    @Override
    public Event constructWebhookEvent(String payload, String signature, String webhookSecret)
            throws SignatureVerificationException {
        return Webhook.constructEvent(payload, signature, webhookSecret);
    }
}
