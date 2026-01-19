package com.speakup.presentation.api;

import com.speakup.application.conversation.ConversationService;
import com.speakup.application.conversation.dto.ConversationResponse;
import com.speakup.application.conversation.dto.EndConversationRequest;
import com.speakup.application.conversation.dto.UserStats;
import com.speakup.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for conversation operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
@Tag(name = "Conversations", description = "Conversation management endpoints")
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping
    @Operation(summary = "Get user conversations", description = "Get paginated list of user's conversations")
    public ResponseEntity<Page<ConversationResponse>> getConversations(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ConversationResponse> conversations = conversationService.getUserConversations(
                principal.getId(), pageable);
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get conversation", description = "Get a specific conversation by ID")
    public ResponseEntity<ConversationResponse> getConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        return conversationService.getConversation(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    @Operation(summary = "Get active conversation", description = "Get user's currently active conversation")
    public ResponseEntity<ConversationResponse> getActiveConversation(
            @AuthenticationPrincipal UserPrincipal principal) {

        return conversationService.getActiveConversation(principal.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/start")
    @Operation(summary = "Start conversation", description = "Mark conversation as started (WebRTC connected)")
    public ResponseEntity<Void> startConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        try {
            conversationService.startConversation(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/end")
    @Operation(summary = "End conversation", description = "End the conversation")
    public ResponseEntity<Void> endConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody EndConversationRequest request) {

        try {
            conversationService.endConversation(id, principal.getId(), request.completed());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "Get user stats", description = "Get conversation statistics for the user")
    public ResponseEntity<UserStats> getUserStats(@AuthenticationPrincipal UserPrincipal principal) {
        UserStats stats = conversationService.getUserStats(principal.getId());
        return ResponseEntity.ok(stats);
    }
}
