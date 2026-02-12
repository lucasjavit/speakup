package com.speakup.domain.email;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduledEmailRepository extends JpaRepository<ScheduledEmail, UUID> {

    List<ScheduledEmail> findByStatusAndScheduledAtBefore(ScheduledEmailStatus status, Instant time);

    List<ScheduledEmail> findAllByOrderByCreatedAtDesc();
}
