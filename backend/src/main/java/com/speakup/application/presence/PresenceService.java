package com.speakup.application.presence;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

/**
 * Tracks which users are currently "online" (active in the app) using Redis.
 * Each heartbeat sets a key with TTL; count = number of keys with that prefix.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private static final String PRESENCE_PREFIX = "presence:";
    private static final Duration PRESENCE_TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Mark user as online. Call this on app load and periodically (e.g. every 2 min).
     */
    public void touch(UUID userId) {
        if (userId == null) return;
        String key = PRESENCE_PREFIX + userId.toString();
        try {
            redisTemplate.opsForValue().set(key, 1, PRESENCE_TTL);
        } catch (Exception e) {
            log.warn("Failed to update presence for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Remove user from online count (e.g. on logout).
     */
    public void remove(UUID userId) {
        if (userId == null) return;
        String key = PRESENCE_PREFIX + userId.toString();
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Failed to remove presence for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Count distinct users currently considered online (had a heartbeat in the last 5 minutes).
     */
    public long countOnline() {
        try {
            Set<String> keys = redisTemplate.keys(PRESENCE_PREFIX + "*");
            return keys != null ? keys.size() : 0;
        } catch (Exception e) {
            log.warn("Failed to count online users: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Count online users excluding the given user (e.g. so "others online" does not include self).
     */
    public long countOnlineExcluding(UUID excludeUserId) {
        if (excludeUserId == null) return countOnline();
        long total = countOnline();
        String key = PRESENCE_PREFIX + excludeUserId.toString();
        if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
            return Math.max(0, total - 1);
        }
        return total;
    }
}
