package com.speakup.domain.rating;

import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.shared.BaseEntity;
import com.speakup.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a post-conversation rating from one user to another.
 * Includes star rating and whether the user wants to talk again.
 */
@Entity
@Table(name = "ratings", indexes = {
    @Index(name = "idx_rating_conversation", columnList = "conversation_id"),
    @Index(name = "idx_rating_rater", columnList = "rater_id"),
    @Index(name = "idx_rating_rated_user", columnList = "rated_user_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_rating_conversation_rater", columnNames = {"conversation_id", "rater_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rating extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rated_user_id", nullable = false)
    private User ratedUser;

    @Column(nullable = false)
    private Integer stars;

    @Column(name = "want_to_talk_again", nullable = false)
    @Builder.Default
    private boolean wantToTalkAgain = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "partner_fluency_level")
    private FluencyLevel partnerFluencyLevel;

    /**
     * Validate the rating before saving.
     * @throws IllegalArgumentException if validation fails
     */
    public void validate() {
        if (stars == null || stars < 1 || stars > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars");
        }
        if (rater.getId().equals(ratedUser.getId())) {
            throw new IllegalArgumentException("Cannot rate yourself");
        }
    }
}
