package com.speakup.application.feedback;

import com.speakup.application.feedback.dto.CreateFeedbackRequest;
import com.speakup.application.feedback.dto.FeedbackDTO;
import com.speakup.application.feedback.dto.FeedbackSummaryDTO;
import com.speakup.domain.feedback.Feedback;
import com.speakup.domain.feedback.FeedbackRepository;
import com.speakup.domain.feedback.FeedbackStatus;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for managing feedbacks.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    /**
     * Create a new feedback (authenticated user).
     */
    @Transactional
    public FeedbackDTO createFeedback(CreateFeedbackRequest request, UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Feedback feedback = Feedback.builder()
                .user(user)
                .userEmail(user.getEmail())
                .userName(user.getName())
                .type(request.type())
                .title(request.title())
                .description(request.description())
                .screenshotData(request.screenshotData())
                .pageUrl(request.pageUrl())
                .userAgent(request.userAgent())
                .status(FeedbackStatus.OPEN)
                .build();

        feedback = feedbackRepository.save(feedback);

        log.info("Feedback created: id={}, type={}, userId={}", 
                feedback.getId(), feedback.getType(), user.getId());

        return FeedbackDTO.from(feedback);
    }

    /**
     * Get feedback by ID (user can only see their own feedback).
     */
    public FeedbackDTO getFeedback(UUID id, UserPrincipal principal) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        // Verify ownership
        if (feedback.getUser() == null || !feedback.getUser().getId().equals(principal.getId())) {
            throw new IllegalArgumentException("You can only view your own feedback");
        }

        return FeedbackDTO.from(feedback);
    }

    /**
     * Get all feedbacks for the authenticated user.
     */
    public Page<FeedbackSummaryDTO> getUserFeedbacks(UserPrincipal principal, Pageable pageable) {
        Page<Feedback> feedbacks = feedbackRepository.findByUserId(principal.getId(), pageable);
        return feedbacks.map(FeedbackSummaryDTO::from);
    }
}
