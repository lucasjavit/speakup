package com.speakup.presentation.api;

import com.speakup.application.matching.MatchingService;
import com.speakup.application.matching.dto.JoinQueueRequest;
import com.speakup.application.matching.dto.QueueStatusResponse;
import com.speakup.domain.matching.QueueEntry;
import com.speakup.infrastructure.redis.RedisQueueService;
import com.speakup.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * REST controller for matching queue operations.
 * WebSocket is used for real-time notifications, but REST endpoints
 * provide an alternative way to manage queue state.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/matching")
@RequiredArgsConstructor
@Tag(name = "Matching", description = "Queue and matching operations")
public class MatchingController {

    private final MatchingService matchingService;
    private final RedisQueueService queueService;

    @PostMapping("/join")
    @Operation(summary = "Join matching queue", description = "Join the queue for a specific session")
    public ResponseEntity<QueueStatusResponse> joinQueue(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody JoinQueueRequest request) {

        try {
            QueueEntry entry = matchingService.joinQueue(principal.getId(), request.sessionId());

            int position = queueService.getQueuePosition(principal.getId());
            long queueSize = queueService.getQueueSize(request.sessionId());

            return ResponseEntity.ok(QueueStatusResponse.builder()
                    .inQueue(true)
                    .sessionId(request.sessionId())
                    .position(position)
                    .estimatedWaitSeconds(position * 30)
                    .queueSize(queueSize)
                    .build());
        } catch (IllegalStateException e) {
            log.warn("Failed to join queue: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/leave")
    @Operation(summary = "Leave matching queue", description = "Remove yourself from the queue")
    public ResponseEntity<Void> leaveQueue(@AuthenticationPrincipal UserPrincipal principal) {
        matchingService.leaveQueue(principal.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status")
    @Operation(summary = "Get queue status", description = "Get your current position in the queue")
    public ResponseEntity<QueueStatusResponse> getQueueStatus(@AuthenticationPrincipal UserPrincipal principal) {
        Optional<QueueEntry> entry = queueService.getUserEntry(principal.getId());

        if (entry.isEmpty()) {
            return ResponseEntity.ok(QueueStatusResponse.builder()
                    .inQueue(false)
                    .sessionId(null)
                    .position(0)
                    .estimatedWaitSeconds(0)
                    .queueSize(0)
                    .build());
        }

        QueueEntry queueEntry = entry.get();
        int position = queueService.getQueuePosition(principal.getId());
        long queueSize = queueService.getQueueSize(queueEntry.getSessionId());

        return ResponseEntity.ok(QueueStatusResponse.builder()
                .inQueue(true)
                .sessionId(queueEntry.getSessionId())
                .position(position)
                .estimatedWaitSeconds(position * 30)
                .queueSize(queueSize)
                .build());
    }
}
