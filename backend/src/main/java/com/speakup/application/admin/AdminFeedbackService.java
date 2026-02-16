package com.speakup.application.admin;

import com.speakup.application.feedback.dto.FeedbackDTO;
import com.speakup.application.feedback.dto.FeedbackStatsDTO;
import com.speakup.application.feedback.dto.FeedbackSummaryDTO;
import com.speakup.application.feedback.dto.UpdateAdminNotesRequest;
import com.speakup.application.feedback.dto.UpdateFeedbackStatusRequest;
import com.speakup.domain.feedback.Feedback;
import com.speakup.domain.feedback.FeedbackRepository;
import com.speakup.domain.feedback.FeedbackStatus;
import com.speakup.domain.feedback.FeedbackType;
import com.speakup.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Admin service for managing feedbacks.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminFeedbackService {

    private final FeedbackRepository feedbackRepository;

    /**
     * Get all feedbacks with optional filters.
     */
    public Page<FeedbackSummaryDTO> getAllFeedbacks(
            FeedbackStatus status,
            FeedbackType type,
            Pageable pageable) {
        
        Page<Feedback> feedbacks;

        if (status != null && type != null) {
            feedbacks = feedbackRepository.findByStatusAndType(status, type, pageable);
        } else if (status != null) {
            feedbacks = feedbackRepository.findByStatus(status, pageable);
        } else if (type != null) {
            feedbacks = feedbackRepository.findByType(type, pageable);
        } else {
            feedbacks = feedbackRepository.findAll(pageable);
        }

        return feedbacks.map(FeedbackSummaryDTO::from);
    }

    /**
     * Get feedback details by ID.
     */
    public FeedbackDTO getFeedback(UUID id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));
        return FeedbackDTO.from(feedback);
    }

    /**
     * Get feedback statistics.
     */
    public FeedbackStatsDTO getFeedbackStats() {
        long total = feedbackRepository.count();
        long open = feedbackRepository.countByStatus(FeedbackStatus.OPEN);
        long inProgress = feedbackRepository.countByStatus(FeedbackStatus.IN_PROGRESS);
        long resolved = feedbackRepository.countByStatus(FeedbackStatus.RESOLVED);
        long closed = feedbackRepository.countByStatus(FeedbackStatus.CLOSED);
        long bugs = feedbackRepository.countByType(FeedbackType.BUG);
        long suggestions = feedbackRepository.countByType(FeedbackType.SUGGESTION);
        long other = feedbackRepository.countByType(FeedbackType.OTHER);

        return new FeedbackStatsDTO(
                total,
                open,
                inProgress,
                resolved,
                closed,
                bugs,
                suggestions,
                other
        );
    }

    /**
     * Update feedback status.
     */
    @Transactional
    public FeedbackDTO updateFeedbackStatus(
            UUID id,
            UpdateFeedbackStatusRequest request,
            UserPrincipal principal) {
        
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        feedback.updateStatus(request.status(), principal.getId());
        feedback = feedbackRepository.save(feedback);

        log.info("Feedback status updated: id={}, status={}, by={}", 
                id, request.status(), principal.getId());

        return FeedbackDTO.from(feedback);
    }

    /**
     * Add or update admin notes.
     */
    @Transactional
    public FeedbackDTO updateAdminNotes(UUID id, UpdateAdminNotesRequest request) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        feedback.updateAdminNotes(request.notes());
        feedback = feedbackRepository.save(feedback);

        log.info("Feedback admin notes updated: id={}", id);

        return FeedbackDTO.from(feedback);
    }

    /**
     * Delete feedback.
     */
    @Transactional
    public void deleteFeedback(UUID id) {
        if (!feedbackRepository.findById(id).isPresent()) {
            throw new IllegalArgumentException("Feedback not found");
        }

        feedbackRepository.deleteById(id);
        log.info("Feedback deleted: id={}", id);
    }
}
