package com.speakup.application.admin.dto;

public record SendEmailResponse(
        String message,
        int recipientCount
) {
}
