package com.speakup.infrastructure.email;

public class EmailSendException extends RuntimeException {

    public EmailSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
