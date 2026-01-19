package com.speakup.infrastructure.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.speakup.domain.matching.QueueEntry;
import com.speakup.domain.user.ProficiencyLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Redis-based queue service for matching.
 * Uses sorted sets with join time as score for FIFO ordering.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisQueueService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String QUEUE_PREFIX = "matching:queue:";
    private static final String USER_QUEUE_PREFIX = "matching:user:";
    private static final Duration QUEUE_TTL = Duration.ofHours(2);

    /**
     * Add a user to the matching queue for a session.
     */
    public void addToQueue(QueueEntry entry) {
        String queueKey = getQueueKey(entry.getSessionId());
        String userKey = getUserKey(entry.getUserId());

        try {
            String entryJson = objectMapper.writeValueAsString(entry);

            // Add to session queue (sorted set by join time)
            double score = entry.getJoinedAt().toEpochMilli();
            redisTemplate.opsForZSet().add(queueKey, entryJson, score);

            // Track which session the user is in
            redisTemplate.opsForValue().set(userKey, entry.getSessionId().toString(), QUEUE_TTL);

            // Set TTL on queue
            redisTemplate.expire(queueKey, QUEUE_TTL);

            log.debug("Added user {} to queue for session {}", entry.getUserId(), entry.getSessionId());
        } catch (JsonProcessingException e) {
            log.error("Error serializing queue entry", e);
            throw new RuntimeException("Failed to add to queue", e);
        }
    }

    /**
     * Remove a user from all queues.
     */
    public void removeFromQueue(UUID userId) {
        String userKey = getUserKey(userId);

        // Find which session the user is in
        Object sessionIdObj = redisTemplate.opsForValue().get(userKey);
        if (sessionIdObj == null) {
            return;
        }

        UUID sessionId = UUID.fromString(sessionIdObj.toString());
        String queueKey = getQueueKey(sessionId);

        // Get all entries and find the one for this user
        Set<Object> entries = redisTemplate.opsForZSet().range(queueKey, 0, -1);
        if (entries != null) {
            for (Object entry : entries) {
                try {
                    QueueEntry queueEntry = objectMapper.readValue(entry.toString(), QueueEntry.class);
                    if (queueEntry.getUserId().equals(userId)) {
                        redisTemplate.opsForZSet().remove(queueKey, entry);
                        break;
                    }
                } catch (JsonProcessingException e) {
                    log.warn("Error deserializing queue entry", e);
                }
            }
        }

        // Remove user tracking
        redisTemplate.delete(userKey);
        log.debug("Removed user {} from queue", userId);
    }

    /**
     * Find candidates for matching based on session and proficiency level.
     */
    public List<QueueEntry> findCandidates(UUID sessionId, ProficiencyLevel level) {
        String queueKey = getQueueKey(sessionId);
        List<QueueEntry> candidates = new ArrayList<>();

        // Get all entries in the queue (ordered by join time)
        Set<Object> entries = redisTemplate.opsForZSet().range(queueKey, 0, -1);
        if (entries == null) {
            return candidates;
        }

        for (Object entry : entries) {
            try {
                QueueEntry queueEntry = objectMapper.readValue(entry.toString(), QueueEntry.class);

                // Check proficiency compatibility
                if (isProficiencyCompatible(level, queueEntry.getProficiencyLevel())) {
                    candidates.add(queueEntry);
                }
            } catch (JsonProcessingException e) {
                log.warn("Error deserializing queue entry", e);
            }
        }

        return candidates;
    }

    /**
     * Get all entries in a session queue.
     */
    public List<QueueEntry> getQueueEntries(UUID sessionId) {
        String queueKey = getQueueKey(sessionId);
        List<QueueEntry> entries = new ArrayList<>();

        Set<Object> rawEntries = redisTemplate.opsForZSet().range(queueKey, 0, -1);
        if (rawEntries == null) {
            return entries;
        }

        for (Object entry : rawEntries) {
            try {
                entries.add(objectMapper.readValue(entry.toString(), QueueEntry.class));
            } catch (JsonProcessingException e) {
                log.warn("Error deserializing queue entry", e);
            }
        }

        return entries;
    }

    /**
     * Get a specific user's queue entry.
     */
    public Optional<QueueEntry> getUserEntry(UUID userId) {
        String userKey = getUserKey(userId);
        Object sessionIdObj = redisTemplate.opsForValue().get(userKey);

        if (sessionIdObj == null) {
            return Optional.empty();
        }

        UUID sessionId = UUID.fromString(sessionIdObj.toString());
        return getQueueEntries(sessionId).stream()
                .filter(e -> e.getUserId().equals(userId))
                .findFirst();
    }

    /**
     * Get the position of a user in the queue.
     */
    public int getQueuePosition(UUID userId) {
        Optional<QueueEntry> entry = getUserEntry(userId);
        if (entry.isEmpty()) {
            return -1;
        }

        List<QueueEntry> entries = getQueueEntries(entry.get().getSessionId());
        for (int i = 0; i < entries.size(); i++) {
            if (entries.get(i).getUserId().equals(userId)) {
                return i + 1;
            }
        }

        return -1;
    }

    /**
     * Get the size of a session queue.
     */
    public long getQueueSize(UUID sessionId) {
        String queueKey = getQueueKey(sessionId);
        Long size = redisTemplate.opsForZSet().size(queueKey);
        return size != null ? size : 0;
    }

    /**
     * Check if a user is in any queue.
     */
    public boolean isUserInQueue(UUID userId) {
        String userKey = getUserKey(userId);
        return Boolean.TRUE.equals(redisTemplate.hasKey(userKey));
    }

    private boolean isProficiencyCompatible(ProficiencyLevel level1, ProficiencyLevel level2) {
        if (level1 == null || level2 == null) {
            return true;
        }

        if (level1 == level2) {
            return true;
        }

        int ordinal1 = level1.ordinal();
        int ordinal2 = level2.ordinal();
        return Math.abs(ordinal1 - ordinal2) <= 1;
    }

    private String getQueueKey(UUID sessionId) {
        return QUEUE_PREFIX + sessionId.toString();
    }

    private String getUserKey(UUID userId) {
        return USER_QUEUE_PREFIX + userId.toString();
    }
}
