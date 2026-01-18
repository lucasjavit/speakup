package com.speakup.infrastructure.persistence;

import com.speakup.domain.user.AuthProvider;
import com.speakup.domain.user.Role;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of UserRepository.
 * Spring Data provides the implementation automatically.
 */
@Repository
public interface JpaUserRepository extends JpaRepository<User, UUID>, UserRepository {

    @Override
    Optional<User> findByEmail(String email);

    @Override
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    @Override
    boolean existsByEmail(String email);

    @Override
    long countByActive(boolean active);

    @Override
    Page<User> findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
            String email, String name, Pageable pageable);

    @Override
    boolean existsByRole(Role role);
}
