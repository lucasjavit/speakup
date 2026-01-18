package com.speakup.presentation.api.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Error response structure for API errors.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String code,
        String message,
        Object details
) {
}
