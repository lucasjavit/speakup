package com.speakup.application.session;

import com.speakup.application.session.dto.CreateSessionRequest;
import com.speakup.application.session.dto.SessionResponse;
import com.speakup.application.session.dto.UpdateSessionRequest;
import com.speakup.domain.session.Session;
import com.speakup.domain.session.SessionRepository;
import com.speakup.domain.session.SessionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing practice sessions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;

    /**
     * Create a new session.
     */
    @Transactional
    public SessionResponse create(CreateSessionRequest request) {
        Session session = Session.builder()
                .name(request.name())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .timezone(request.timezone())
                .status(SessionStatus.ACTIVE)
                .build();
        session.setDaysOfWeekSet(request.daysOfWeek());

        Session saved = sessionRepository.save(session);
        log.info("Created session: {} ({})", saved.getName(), saved.getId());

        return SessionResponse.from(saved);
    }

    /**
     * Get all sessions.
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> findAll() {
        return sessionRepository.findAll().stream()
                .map(SessionResponse::from)
                .toList();
    }

    /**
     * Get sessions with pagination.
     */
    @Transactional(readOnly = true)
    public Page<SessionResponse> findAll(Pageable pageable) {
        return sessionRepository.findAll(pageable)
                .map(SessionResponse::from);
    }

    /**
     * Get session by ID.
     */
    @Transactional(readOnly = true)
    public SessionResponse findById(UUID id) {
        return sessionRepository.findById(id)
                .map(SessionResponse::from)
                .orElseThrow(() -> new SessionNotFoundException(id));
    }

    /**
     * Update a session.
     */
    @Transactional
    public SessionResponse update(UUID id, UpdateSessionRequest request) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new SessionNotFoundException(id));

        session.setName(request.name());
        session.setStartTime(request.startTime());
        session.setEndTime(request.endTime());
        session.setTimezone(request.timezone());
        session.setDaysOfWeekSet(request.daysOfWeek());

        Session saved = sessionRepository.save(session);
        log.info("Updated session: {} ({})", saved.getName(), saved.getId());

        return SessionResponse.from(saved);
    }

    /**
     * Update session status.
     */
    @Transactional
    public SessionResponse updateStatus(UUID id, SessionStatus status) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new SessionNotFoundException(id));

        session.setStatus(status);
        Session saved = sessionRepository.save(session);
        log.info("Updated session status: {} -> {}", saved.getId(), status);

        return SessionResponse.from(saved);
    }

    /**
     * Delete a session.
     */
    @Transactional
    public void delete(UUID id) {
        if (sessionRepository.findById(id).isEmpty()) {
            throw new SessionNotFoundException(id);
        }
        sessionRepository.deleteById(id);
        log.info("Deleted session: {}", id);
    }

    /**
     * Get active sessions.
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> findActiveSessions() {
        return sessionRepository.findByStatus(SessionStatus.ACTIVE).stream()
                .map(SessionResponse::from)
                .toList();
    }

    /**
     * Get currently running sessions.
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> findCurrentlyRunningSessions() {
        return sessionRepository.findByStatus(SessionStatus.ACTIVE).stream()
                .filter(Session::isCurrentlyRunning)
                .map(SessionResponse::from)
                .toList();
    }

    /**
     * Count sessions.
     */
    @Transactional(readOnly = true)
    public long count() {
        return sessionRepository.count();
    }

    /**
     * Count active sessions.
     */
    @Transactional(readOnly = true)
    public long countActive() {
        return sessionRepository.countByStatus(SessionStatus.ACTIVE);
    }
}
