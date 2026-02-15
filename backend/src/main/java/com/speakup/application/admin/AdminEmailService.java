package com.speakup.application.admin;

import com.speakup.application.admin.dto.ScheduleEmailRequest;
import com.speakup.application.admin.dto.SendEmailRequest;
import com.speakup.application.admin.dto.SendEmailResponse;
import com.speakup.domain.email.ScheduledEmail;
import com.speakup.domain.email.ScheduledEmailRepository;
import com.speakup.domain.email.ScheduledEmailStatus;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminEmailService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ScheduledEmailRepository scheduledEmailRepository;

    @Transactional(readOnly = true)
    public SendEmailResponse sendEmail(SendEmailRequest request) {
        List<String> recipientEmails = resolveRecipients(request.userIds());

        if (recipientEmails.isEmpty()) {
            return new SendEmailResponse("No active recipients found", 0);
        }

        emailService.sendBulkEmail(recipientEmails, request.subject(), request.body());

        return new SendEmailResponse(
                "Email is being sent to " + recipientEmails.size() + " recipient(s)",
                recipientEmails.size()
        );
    }

    @Transactional
    public ScheduledEmail scheduleEmail(ScheduleEmailRequest request) {
        String recipientType = (request.userIds() == null || request.userIds().isEmpty()) ? "ALL" : "SELECTED";
        String userIdsStr = null;
        if (request.userIds() != null && !request.userIds().isEmpty()) {
            userIdsStr = request.userIds().stream()
                    .map(UUID::toString)
                    .collect(Collectors.joining(","));
        }

        // Calculate recipient count at scheduling time
        List<String> recipients = resolveRecipients(request.userIds());
        int recipientCount = recipients.size();

        ScheduledEmail scheduled = ScheduledEmail.builder()
                .subject(request.subject())
                .body(request.body())
                .scheduledAt(request.scheduledAt())
                .recipientType(recipientType)
                .userIds(userIdsStr)
                .recipientCount(recipientCount)
                .status(ScheduledEmailStatus.PENDING)
                .build();

        scheduled = scheduledEmailRepository.save(scheduled);
        log.info("Email scheduled for {} with id {} for {} recipients", 
                request.scheduledAt(), scheduled.getId(), recipientCount);
        return scheduled;
    }

    @Transactional(readOnly = true)
    public List<ScheduledEmail> getScheduledEmails() {
        return scheduledEmailRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void cancelScheduledEmail(UUID id) {
        ScheduledEmail email = scheduledEmailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Scheduled email not found"));

        // Always delete from database
        scheduledEmailRepository.delete(email);
        log.info("Scheduled email {} deleted from database (status was: {})", id, email.getStatus());
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processScheduledEmails() {
        List<ScheduledEmail> pending = scheduledEmailRepository
                .findByStatusAndScheduledAtBefore(ScheduledEmailStatus.PENDING, Instant.now());

        for (ScheduledEmail email : pending) {
            email.setStatus(ScheduledEmailStatus.SENDING);
            scheduledEmailRepository.save(email);

            try {
                List<UUID> userIds = null;
                if ("SELECTED".equals(email.getRecipientType()) && email.getUserIds() != null) {
                    userIds = Arrays.stream(email.getUserIds().split(","))
                            .map(String::trim)
                            .map(UUID::fromString)
                            .toList();
                }

                List<String> recipients = resolveRecipients(userIds);

                if (recipients.isEmpty()) {
                    email.setStatus(ScheduledEmailStatus.FAILED);
                    email.setErrorMessage("No active recipients found");
                    scheduledEmailRepository.save(email);
                    continue;
                }

                emailService.sendBulkEmail(recipients, email.getSubject(), email.getBody());
                email.setStatus(ScheduledEmailStatus.SENT);
                email.setSentAt(Instant.now());
                email.setRecipientCount(recipients.size());
                log.info("Scheduled email {} sent to {} recipients", email.getId(), recipients.size());
            } catch (Exception e) {
                email.setStatus(ScheduledEmailStatus.FAILED);
                email.setErrorMessage(e.getMessage());
                log.error("Failed to send scheduled email {}: {}", email.getId(), e.getMessage());
            }

            scheduledEmailRepository.save(email);
        }
    }

    private List<String> resolveRecipients(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return userRepository.findAll().stream()
                    .filter(User::isActive)
                    .map(User::getEmail)
                    .toList();
        } else {
            return userIds.stream()
                    .map(userRepository::findById)
                    .filter(java.util.Optional::isPresent)
                    .map(java.util.Optional::get)
                    .filter(User::isActive)
                    .map(User::getEmail)
                    .toList();
        }
    }
}
