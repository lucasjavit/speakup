package com.speakup.infrastructure.security;

import com.speakup.domain.user.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.security.Principal;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * User principal for authentication context.
 * Contains essential user information for the security context.
 */
@Getter
public class UserPrincipal implements Principal {

    private final UUID id;
    private final String email;
    private final Role role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID id, String email, Role role) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getName() {
        return email;
    }

    /**
     * Check if user has admin privileges.
     */
    public boolean isAdmin() {
        return role != null && role.isAdmin();
    }
}
