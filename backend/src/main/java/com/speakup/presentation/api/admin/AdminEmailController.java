package com.speakup.presentation.api.admin;

import com.speakup.application.admin.AdminEmailService;
import com.speakup.application.admin.dto.ScheduleEmailRequest;
import com.speakup.application.admin.dto.SendEmailRequest;
import com.speakup.application.admin.dto.SendEmailResponse;
import com.speakup.domain.email.ScheduledEmail;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/email")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MODERATOR', 'SUPER_ADMIN')")
@Tag(name = "Admin - Email", description = "Email sending endpoints for administrators")
public class AdminEmailController {

    private final AdminEmailService adminEmailService;

    @PostMapping("/send")
    @Operation(summary = "Send email to users immediately")
    public ResponseEntity<ApiResponse<SendEmailResponse>> sendEmail(
            @Valid @RequestBody SendEmailRequest request) {
        SendEmailResponse response = adminEmailService.sendEmail(request);
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(response));
    }

    @PostMapping("/schedule")
    @Operation(summary = "Schedule email for later delivery")
    public ResponseEntity<ApiResponse<ScheduledEmail>> scheduleEmail(
            @Valid @RequestBody ScheduleEmailRequest request) {
        ScheduledEmail scheduled = adminEmailService.scheduleEmail(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(scheduled));
    }

    @GetMapping("/scheduled")
    @Operation(summary = "List all scheduled emails")
    public ResponseEntity<ApiResponse<List<ScheduledEmail>>> getScheduledEmails() {
        List<ScheduledEmail> emails = adminEmailService.getScheduledEmails();
        return ResponseEntity.ok(ApiResponse.success(emails));
    }

    @DeleteMapping("/scheduled/{id}")
    @Operation(summary = "Cancel a pending scheduled email")
    public ResponseEntity<ApiResponse<Void>> cancelScheduledEmail(@PathVariable UUID id) {
        adminEmailService.cancelScheduledEmail(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
