package com.speakup.presentation.api.admin;

import com.speakup.application.payment.PaymentService;
import com.speakup.application.payment.dto.AdminPurchaseResponse;
import com.speakup.domain.credit.PaymentStatus;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin controller for managing payments.
 */
@RestController
@RequestMapping("/api/v1/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PAYMENT_ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Admin - Payments", description = "Payment management endpoints for administrators")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @Operation(summary = "List all purchases", description = "Returns all purchases with pagination and optional status filter")
    public ResponseEntity<ApiResponse<Page<AdminPurchaseResponse>>> listPurchases(
            @RequestParam(required = false) List<PaymentStatus> status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AdminPurchaseResponse> purchases = paymentService.getAllPurchases(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }
}
