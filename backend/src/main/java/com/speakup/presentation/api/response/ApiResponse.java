package com.speakup.presentation.api.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Standard API response wrapper.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        T data,
        ErrorResponse error
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(null, new ErrorResponse(code, message, null));
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return new ApiResponse<>(null, new ErrorResponse(code, message, details));
    }
}
