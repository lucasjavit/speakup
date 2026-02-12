package com.speakup.infrastructure.email;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class EmailConfig {

    @Value("${email.from}")
    private String fromAddress;

    @Value("${email.from-name:SpeakUp}")
    private String fromName;
}
