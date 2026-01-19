package com.speakup.application.admin;

import com.speakup.application.admin.dto.AdminUserResponse;
import com.speakup.domain.user.Role;
import com.speakup.domain.user.User;
import com.speakup.domain.user.UserRepository;
import com.speakup.domain.user.exception.UserNotFoundException;
import com.speakup.domain.shared.ForbiddenOperationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Admin service for managing users.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    /**
     * Get all users with pagination.
     */
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> findAll(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(AdminUserResponse::from);
    }

    /**
     * Search users by email or name.
     */
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> search(String query, Pageable pageable) {
        return userRepository.findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
                query, query, pageable)
                .map(AdminUserResponse::from);
    }

    /**
     * Get user by ID.
     */
    @Transactional(readOnly = true)
    public AdminUserResponse findById(UUID id) {
        return userRepository.findById(id)
                .map(AdminUserResponse::from)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    /**
     * Update user role.
     */
    @Transactional
    public AdminUserResponse updateRole(UUID id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        user.setRole(role);
        User saved = userRepository.save(user);
        log.info("Updated user role: {} -> {}", id, role);

        return AdminUserResponse.from(saved);
    }

    /**
     * Update user active status.
     * Only SUPER_ADMIN can deactivate themselves. No admin can deactivate a SUPER_ADMIN except themselves.
     */
    @Transactional
    public AdminUserResponse updateStatus(UUID id, boolean active, UUID currentUserId, Role currentUserRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        // Validation: Only SUPER_ADMIN can deactivate a SUPER_ADMIN (themselves)
        if (!active && user.getRole() == Role.SUPER_ADMIN) {
            if (currentUserRole != Role.SUPER_ADMIN) {
                throw new ForbiddenOperationException("Only SUPER_ADMIN can deactivate a SUPER_ADMIN");
            }
            if (!id.equals(currentUserId)) {
                throw new ForbiddenOperationException("SUPER_ADMIN can only deactivate themselves");
            }
        }

        if (active) {
            user.activate();
        } else {
            user.deactivate();
        }

        User saved = userRepository.save(user);
        log.info("Updated user status: {} -> active={}", id, active);

        return AdminUserResponse.from(saved);
    }

    /**
     * Count total users.
     */
    @Transactional(readOnly = true)
    public long count() {
        return userRepository.count();
    }

    /**
     * Count active users.
     */
    @Transactional(readOnly = true)
    public long countActive() {
        return userRepository.countByActive(true);
    }
}
