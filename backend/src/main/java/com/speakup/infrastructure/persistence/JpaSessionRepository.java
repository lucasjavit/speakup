package com.speakup.infrastructure.persistence;

import com.speakup.domain.session.Session;
import com.speakup.domain.session.SessionRepository;
import com.speakup.domain.session.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * JPA implementation of SessionRepository.
 * Spring Data provides the implementation automatically.
 */
@Repository
public interface JpaSessionRepository extends JpaRepository<Session, UUID>, SessionRepository {

    @Override
    List<Session> findByStatus(SessionStatus status);

    @Override
    long countByStatus(SessionStatus status);
}
