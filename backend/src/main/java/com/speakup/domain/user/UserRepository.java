package com.speakup.domain.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User domain operations.
 * Follows Repository pattern - implementation in infrastructure layer.
 */
public interface UserRepository {

    Optional<User> findById(UUID id);

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    User save(User user);

    boolean existsByEmail(String email);

    void delete(User user);

    Page<User> findAll(Pageable pageable);

    List<User> findAll();

    long count();

    long countByActive(boolean active);

    Page<User> findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
            String email, String name, Pageable pageable);

    boolean existsByRole(Role role);
}
