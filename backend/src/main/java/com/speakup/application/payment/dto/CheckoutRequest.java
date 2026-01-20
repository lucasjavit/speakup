package com.speakup.application.payment.dto;

import com.speakup.domain.credit.ProductType;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a checkout session.
 */
public record CheckoutRequest(
        @NotNull(message = "Product type is required")
        ProductType productType
) {
}
