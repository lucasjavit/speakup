package com.speakup.application.payment.dto;

import java.util.List;

/**
 * Response DTO for list of products grouped by type.
 */
public record ProductListResponse(
        List<ProductResponse> sessionProducts,
        List<ProductResponse> conversationProducts
) {
}
