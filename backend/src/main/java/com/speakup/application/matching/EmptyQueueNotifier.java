package com.speakup.application.matching;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.speakup.application.admin.AdminEmailService;
import com.speakup.application.admin.dto.SendEmailRequest;
import com.speakup.application.presence.PresenceService;
import com.speakup.application.settings.SettingsService;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmptyQueueNotifier {

    private static final String NOTIFY_COOLDOWN_KEY = "notify:empty_queue:cooldown";
    private static final Duration NOTIFY_COOLDOWN = Duration.ofMinutes(30);

    private final PresenceService presenceService;
    private final SettingsService settingsService;
    private final AdminEmailService adminEmailService;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Async
    public void notifyIfEmpty(UUID triggerUserId, String triggerUserName) {
        log.info("[EmptyQueueNotifier] Checking if notification should be sent (user: {}, name: {})", triggerUserId, triggerUserName);
        try {
            boolean enabled = settingsService.isNotifyOnEmptyQueueEnabled();
            log.info("[EmptyQueueNotifier] Setting NOTIFY_ON_EMPTY_QUEUE enabled: {}", enabled);
            if (!enabled) {
                log.info("[EmptyQueueNotifier] SKIPPED - feature is disabled");
                return;
            }

            long othersOnline = presenceService.countOnlineExcluding(triggerUserId);
            log.info("[EmptyQueueNotifier] Others online (excluding trigger user): {}", othersOnline);
            if (othersOnline > 0) {
                log.info("[EmptyQueueNotifier] SKIPPED - {} other users are online", othersOnline);
                return;
            }

            // Check cooldown
            Boolean cooldownExists = redisTemplate.hasKey(NOTIFY_COOLDOWN_KEY);
            log.info("[EmptyQueueNotifier] Cooldown active: {}", Boolean.TRUE.equals(cooldownExists));
            if (Boolean.TRUE.equals(cooldownExists)) {
                log.info("[EmptyQueueNotifier] SKIPPED - cooldown active (30 min)");
                return;
            }

            // Set cooldown
            redisTemplate.opsForValue().set(NOTIFY_COOLDOWN_KEY, "1", NOTIFY_COOLDOWN);
            log.info("[EmptyQueueNotifier] Cooldown set for 30 minutes");

            // Send to all active users except the trigger user
            List<UUID> recipientIds = userRepository.findAll().stream()
                    .filter(u -> u.isActive() && !u.getId().equals(triggerUserId))
                    .map(User::getId)
                    .toList();

            log.info("[EmptyQueueNotifier] Found {} recipients (excluding trigger user)", recipientIds.size());
            if (recipientIds.isEmpty()) {
                log.info("[EmptyQueueNotifier] SKIPPED - no recipients found");
                return;
            }

            String subject = "[SPEAKYOU] " + triggerUserName + " está online no SpeakYou!";
            String body = triggerUserName + " acabou de entrar e está disponível para conversar. \nEntre agora e pratique seu inglês!\n\nhttps://speakyou.co\n\nAtt,\nSpeakYou";

            log.info("[EmptyQueueNotifier] SENDING email to {} recipients...", recipientIds.size());
            adminEmailService.sendEmail(new SendEmailRequest(subject, body, recipientIds));
            log.info("[EmptyQueueNotifier] SUCCESS - email sent to {} users (triggered by {})", recipientIds.size(), triggerUserId);
        } catch (Exception e) {
            log.error("[EmptyQueueNotifier] FAILED - {}", e.getMessage(), e);
        }
    }
}
