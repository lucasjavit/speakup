package com.speakup.presentation.api;

import com.speakup.application.credit.CreditService;
import com.speakup.application.credit.dto.CreditTransactionResponse;
import com.speakup.application.credit.dto.CreditWalletResponse;
import com.speakup.domain.credit.BillingMode;
import com.speakup.domain.credit.CreditType;
import com.speakup.infrastructure.security.UserPrincipal;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for credit operations.
 */
@RestController
@RequestMapping("/api/v1/credits")
@RequiredArgsConstructor
@Tag(name = "Credits", description = "Credit management endpoints")
public class CreditController {

    private final CreditService creditService;

    @GetMapping
    @Operation(summary = "Get credit wallet", description = "Returns the current user's credit wallet with balances")
    public ResponseEntity<ApiResponse<CreditWalletResponse>> getWallet(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        CreditWalletResponse wallet = creditService.getOrCreateWallet(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @GetMapping("/history")
    @Operation(summary = "Get transaction history", description = "Returns paginated transaction history")
    public ResponseEntity<ApiResponse<Page<CreditTransactionResponse>>> getTransactionHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) CreditType creditType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }

        Page<CreditTransactionResponse> history;
        if (creditType != null) {
            history = creditService.getTransactionHistory(principal.getId(), creditType, pageable);
        } else {
            history = creditService.getTransactionHistory(principal.getId(), pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PutMapping("/billing-mode")
    @Operation(summary = "Change billing mode", description = "Changes the user's billing mode (SESSION or CONVERSATION)")
    public ResponseEntity<ApiResponse<CreditWalletResponse>> setBillingMode(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam BillingMode billingMode
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        CreditWalletResponse wallet = creditService.setBillingMode(principal.getId(), billingMode);
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @GetMapping("/can-join")
    @Operation(summary = "Check if user can join session", description = "Returns whether the user has credits to join a session")
    public ResponseEntity<ApiResponse<Boolean>> canJoinSession(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        boolean canJoin = creditService.hasCreditsForSession(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(canJoin));
    }

    @GetMapping("/free-mode")
    @Operation(summary = "Check if free mode is enabled", description = "Returns whether free mode is active (no credits needed)")
    public ResponseEntity<ApiResponse<Boolean>> isFreeModeEnabled() {
        boolean freeMode = creditService.isFreeModeEnabled();
        return ResponseEntity.ok(ApiResponse.success(freeMode));
    }
}
