package com.speakup.application.payment.dto;

import com.speakup.domain.credit.CreditType;
import com.speakup.domain.credit.ProductType;

import java.math.BigDecimal;

/**
 * Response DTO for product information.
 */
public record ProductResponse(
        String id,
        String name,
        int credits,
        CreditType creditType,
        BigDecimal price,
        BigDecimal pricePerCredit,
        String discount,
        boolean popular,
        boolean bestValue
) {
    public static ProductResponse from(ProductType productType) {
        return new ProductResponse(
                productType.name(),
                productType.getDisplayName(),
                productType.getCredits(),
                productType.getCreditType(),
                productType.getPrice(),
                productType.getPricePerCredit(),
                productType.getDiscount(),
                productType.isPopular(),
                productType.isBestValue()
        );
    }
}
