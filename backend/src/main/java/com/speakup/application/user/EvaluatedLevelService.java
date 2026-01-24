package com.speakup.application.user;

import com.speakup.domain.rating.FluencyLevel;
import com.speakup.domain.rating.Rating;
import com.speakup.domain.rating.RatingRepository;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service responsible for calculating and updating user's evaluated proficiency level
 * based on partner ratings received during conversations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluatedLevelService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    /**
     * Calculates the evaluated proficiency level for a user based on the average
     * of all fluency level ratings received from conversation partners.
     *
     * @param userId the ID of the user
     * @return the calculated proficiency level, or null if no ratings exist
     */
    public ProficiencyLevel calculateEvaluatedLevel(UUID userId) {
        List<Rating> receivedRatings = ratingRepository
            .findByRatedUserIdOrderByCreatedAtDesc(userId);

        if (receivedRatings.isEmpty()) {
            log.debug("No ratings found for user {}", userId);
            return null;
        }

        // Calculate average points from fluency level ratings
        double sumPoints = receivedRatings.stream()
            .filter(rating -> rating.getPartnerFluencyLevel() != null)
            .mapToDouble(rating -> fluencyLevelToPoints(rating.getPartnerFluencyLevel()))
            .sum();

        long count = receivedRatings.stream()
            .filter(rating -> rating.getPartnerFluencyLevel() != null)
            .count();

        if (count == 0) {
            log.debug("No fluency level ratings found for user {}", userId);
            return null;
        }

        double avgPoints = sumPoints / count;
        ProficiencyLevel level = pointsToProficiencyLevel(avgPoints);

        log.debug("Calculated evaluated level for user {}: {} (avg: {})",
                 userId, level, avgPoints);

        return level;
    }

    /**
     * Converts a FluencyLevel to numeric points for average calculation.
     *
     * @param fluencyLevel the fluency level from rating
     * @return numeric points (1.0 to 4.0)
     */
    private double fluencyLevelToPoints(FluencyLevel fluencyLevel) {
        return switch (fluencyLevel) {
            case BASIC -> 1.0;
            case ELEMENTARY -> 2.0;
            case LEVEL_UP -> 3.0;
            case EXPERT -> 4.0;
        };
    }

    /**
     * Converts average points to a ProficiencyLevel.
     *
     * @param points average points from ratings
     * @return the corresponding proficiency level
     */
    private ProficiencyLevel pointsToProficiencyLevel(double points) {
        if (points < 1.5) return ProficiencyLevel.BASIC;
        if (points < 2.5) return ProficiencyLevel.ELEMENTARY;
        if (points < 3.5) return ProficiencyLevel.LEVEL_UP;
        return ProficiencyLevel.EXPERT;
    }

    /**
     * Updates the user's evaluated level, total evaluations count, and last evaluation timestamp.
     * This method should be called after a new rating is created.
     *
     * @param userId the ID of the user who received the rating
     * @throws IllegalArgumentException if user not found
     */
    @Transactional
    public void updateUserEvaluatedLevel(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        ProficiencyLevel evaluatedLevel = calculateEvaluatedLevel(userId);
        int totalEvaluations = (int) ratingRepository.countByRatedUserId(userId);

        user.setEvaluatedLevel(evaluatedLevel);
        user.setTotalEvaluations(totalEvaluations);
        user.setLastEvaluationAt(Instant.now());

        userRepository.save(user);

        log.info("Updated evaluated level for user {}: {} ({} total evaluations)",
                userId, evaluatedLevel, totalEvaluations);
    }
}
