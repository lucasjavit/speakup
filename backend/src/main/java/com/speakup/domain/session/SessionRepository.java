package com.speakup.domain.session;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Session domain operations.
 */
public interface SessionRepository {

    Optional<Session> findById(UUID id);

    List<Session> findAll();

    Page<Session> findAll(Pageable pageable);

    List<Session> findByStatus(SessionStatus status);

    Session save(Session session);

    void delete(Session session);

    void deleteById(UUID id);

    long count();

    long countByStatus(SessionStatus status);

    /**
     * Find all sessions that are currently running (active and within time window).
     */
    List<Session> findByCurrentlyRunning();
}
