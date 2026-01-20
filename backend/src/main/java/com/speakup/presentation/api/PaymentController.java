package com.speakup.presentation.api;

import com.speakup.application.payment.PaymentService;
import com.speakup.application.payment.dto.CheckoutRequest;
import com.speakup.application.payment.dto.CheckoutResponse;
import com.speakup.application.payment.dto.ProductListResponse;
import com.speakup.application.payment.dto.PurchaseResponse;
import com.speakup.infrastructure.security.UserPrincipal;
import com.speakup.presentation.api.response.ApiResponse;
import com.stripe.exception.StripeException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for payment operations.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payments", description = "Payment and product endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/products")
    @Operation(summary = "Get available products", description = "Returns all available credit packages")
    public ResponseEntity<ApiResponse<ProductListResponse>> getProducts() {
        ProductListResponse products = paymentService.getProducts();
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @PostMapping("/purchases/checkout")
    @Operation(summary = "Create checkout session", description = "Creates a Stripe checkout session for purchasing credits")
    public ResponseEntity<ApiResponse<CheckoutResponse>> createCheckout(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CheckoutRequest request
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            CheckoutResponse response = paymentService.createCheckoutSession(principal.getId(), request.productType());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (StripeException e) {
            log.error("Failed to create checkout session for user {}: {}", principal.getId(), e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("STRIPE_ERROR", "Failed to create checkout session: " + e.getMessage()));
        }
    }

    @GetMapping("/purchases")
    @Operation(summary = "Get purchase history", description = "Returns paginated purchase history")
    public ResponseEntity<ApiResponse<Page<PurchaseResponse>>> getPurchaseHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        Page<PurchaseResponse> history = paymentService.getPurchaseHistory(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/purchases/session")
    @Operation(summary = "Get purchase by Stripe session", description = "Returns purchase details by Stripe session ID")
    public ResponseEntity<ApiResponse<PurchaseResponse>> getPurchaseBySession(
            @RequestParam String sessionId
    ) {
        try {
            PurchaseResponse purchase = paymentService.getPurchaseBySessionId(sessionId);
            return ResponseEntity.ok(ApiResponse.success(purchase));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
