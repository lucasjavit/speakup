package com.speakup.application.rating;

import com.speakup.application.rating.dto.RatingResponse;
import com.speakup.application.rating.dto.SubmitRatingRequest;
import com.speakup.application.user.EvaluatedLevelService;
import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationRepository;
import com.speakup.domain.rating.FluencyLevel;
import com.speakup.domain.rating.Rating;
import com.speakup.domain.rating.RatingRepository;
import com.speakup.domain.relationship.RelationshipType;
import com.speakup.domain.relationship.UserRelationship;
import com.speakup.domain.relationship.UserRelationshipRepository;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing ratings.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final UserRelationshipRepository relationshipRepository;
    private final EvaluatedLevelService evaluatedLevelService;

    /**
     * Submit a rating for a conversation.
     */
    @Transactional
    public RatingResponse submitRating(UUID raterId, SubmitRatingRequest request) {
        // Check if rating already exists
        if (ratingRepository.existsByConversationIdAndRaterId(request.conversationId(), raterId)) {
            throw new IllegalArgumentException("You have already rated this conversation");
        }

        // Load conversation
        Conversation conversation = conversationRepository.findById(request.conversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        // Verify user is part of this conversation
        User rater = userRepository.findById(raterId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isUserA = conversation.getUserA().getId().equals(raterId);
        boolean isUserB = conversation.getUserB().getId().equals(raterId);

        if (!isUserA && !isUserB) {
            throw new IllegalArgumentException("You are not part of this conversation");
        }

        // Determine who is being rated
        User ratedUser = isUserA ? conversation.getUserB() : conversation.getUserA();

        // Parse fluency level if provided
        FluencyLevel fluencyLevel = null;
        if (request.partnerFluencyLevel() != null && !request.partnerFluencyLevel().isBlank()) {
            try {
                fluencyLevel = FluencyLevel.valueOf(request.partnerFluencyLevel());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid fluency level provided: {}", request.partnerFluencyLevel());
            }
        }

        // Create and save rating
        Rating rating = Rating.builder()
                .conversation(conversation)
                .rater(rater)
                .ratedUser(ratedUser)
                .stars(request.stars())
                .wantToTalkAgain(request.wantToTalkAgain())
                .partnerFluencyLevel(fluencyLevel)
                .build();

        rating.validate();
        rating = ratingRepository.save(rating);

        log.info("Rating submitted: user {} rated user {} with {} stars for conversation {}",
                raterId, ratedUser.getId(), request.stars(), request.conversationId());

        // Update evaluated level for the rated user
        evaluatedLevelService.updateUserEvaluatedLevel(ratedUser.getId());

        // Handle "want to talk again" - create favorite relationship
        boolean mutualInterest = false;
        if (request.wantToTalkAgain()) {
            mutualInterest = handleWantToTalkAgain(rater, ratedUser, conversation);
        }

        return RatingResponse.from(rating, mutualInterest);
    }

    /**
     * Handle the "want to talk again" action.
     * Creates a FAVORITE relationship and checks for mutual interest.
     */
    private boolean handleWantToTalkAgain(User rater, User ratedUser, Conversation conversation) {
        // Check if favorite already exists
        if (!relationshipRepository.existsByUserIdAndTargetUserIdAndType(
                rater.getId(), ratedUser.getId(), RelationshipType.FAVORITE)) {

            // Create favorite relationship
            UserRelationship favorite = UserRelationship.builder()
                    .user(rater)
                    .targetUser(ratedUser)
                    .type(RelationshipType.FAVORITE)
                    .conversation(conversation)
                    .build();

            favorite.validate();
            relationshipRepository.save(favorite);

            log.info("Favorite relationship created: {} -> {}", rater.getId(), ratedUser.getId());
        }

        // Check for mutual interest (both users favorited each other)
        boolean isMutual = relationshipRepository.areMutualFavorites(rater.getId(), ratedUser.getId());

        if (isMutual) {
            log.info("Mutual interest detected between {} and {}", rater.getId(), ratedUser.getId());
        }

        return isMutual;
    }

    /**
     * Get rating for a conversation by the current user.
     */
    @Transactional(readOnly = true)
    public Optional<RatingResponse> getRatingForConversation(UUID conversationId, UUID raterId) {
        return ratingRepository.findByConversationIdAndRaterId(conversationId, raterId)
                .map(rating -> {
                    boolean mutualInterest = false;
                    if (rating.isWantToTalkAgain()) {
                        mutualInterest = relationshipRepository.areMutualFavorites(
                                rating.getRater().getId(),
                                rating.getRatedUser().getId()
                        );
                    }
                    return RatingResponse.from(rating, mutualInterest);
                });
    }

    /**
     * Check if user has already rated a conversation.
     */
    @Transactional(readOnly = true)
    public boolean hasUserRated(UUID conversationId, UUID raterId) {
        return ratingRepository.existsByConversationIdAndRaterId(conversationId, raterId);
    }

    /**
     * Get average rating for a user.
     */
    @Transactional(readOnly = true)
    public Double getAverageRating(UUID userId) {
        return ratingRepository.getAverageRatingByRatedUserId(userId);
    }

    /**
     * Get total number of ratings received by a user.
     */
    @Transactional(readOnly = true)
    public long getRatingCount(UUID userId) {
        return ratingRepository.countByRatedUserId(userId);
    }
}
