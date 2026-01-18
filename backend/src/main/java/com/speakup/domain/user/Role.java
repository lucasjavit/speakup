package com.speakup.domain.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * User roles for access control.
 */
@Getter
@RequiredArgsConstructor
public enum Role {
    USER("Regular user"),
    MODERATOR("Can manage sessions and users"),
    PAYMENT_ADMIN("Can manage payments and financial reports"),
    SUPER_ADMIN("Full access to all features");

    private final String description;

    /**
     * Check if this role has admin privileges.
     */
    public boolean isAdmin() {
        return this != USER;
    }

    /**
     * Check if this role can manage sessions.
     */
    public boolean canManageSessions() {
        return this == MODERATOR || this == SUPER_ADMIN;
    }

    /**
     * Check if this role can manage users.
     */
    public boolean canManageUsers() {
        return this == MODERATOR || this == SUPER_ADMIN;
    }

    /**
     * Check if this role can manage payments.
     */
    public boolean canManagePayments() {
        return this == PAYMENT_ADMIN || this == SUPER_ADMIN;
    }

    /**
     * Check if this role can create other admins.
     */
    public boolean canCreateAdmins() {
        return this == SUPER_ADMIN;
    }
}
