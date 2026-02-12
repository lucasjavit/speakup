package com.speakup.infrastructure.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailConfig emailConfig;

    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(
                    emailConfig.getFromAddress(), emailConfig.getFromName()));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new EmailSendException("Failed to send email to " + to, e);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new EmailSendException("Failed to send email to " + to + ": " + e.getMessage(), e);
        }
    }

    public void sendBulkEmail(List<String> recipients, String subject, String body) {
        log.info("Starting bulk email send to {} recipients", recipients.size());
        int successCount = 0;
        int failCount = 0;

        for (String recipient : recipients) {
            try {
                sendEmail(recipient, subject, body);
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.error("Bulk email failed for {}: {}", recipient, e.getMessage());
                // Rethrow so API returns 502 with message instead of 500
                throw e instanceof EmailSendException ? (EmailSendException) e : new EmailSendException("Failed to send email: " + e.getMessage(), e);
            }
        }

        log.info("Bulk email completed: {} sent, {} failed out of {} total",
                successCount, failCount, recipients.size());
    }
}
