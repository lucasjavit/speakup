package com.speakup.domain.relationship;

/**
 * Types of relationships between users.
 */
public enum RelationshipType {
    /**
     * User wants to talk again with this person.
     * When both users have FAVORITE for each other, they become mutual favorites.
     */
    FAVORITE,

    /**
     * User never wants to be matched with this person again.
     */
    BLOCK
}
