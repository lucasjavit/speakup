package com.speakup.infrastructure.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.security.Principal;
import java.util.UUID;

/**
 * User principal for authentication context.
 * Contains essential user information for the security context.
 */
@Getter
@AllArgsConstructor
public class UserPrincipal implements Principal {

    private final UUID id;
    private final String email;

    @Override
    public String getName() {
        return email;
    }
}
