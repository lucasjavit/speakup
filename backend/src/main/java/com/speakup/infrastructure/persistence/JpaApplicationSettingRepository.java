package com.speakup.infrastructure.persistence;

import com.speakup.domain.settings.ApplicationSetting;
import com.speakup.domain.settings.ApplicationSettingRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA implementation of ApplicationSettingRepository.
 * Spring Data provides the implementation automatically.
 */
@Repository
public interface JpaApplicationSettingRepository extends JpaRepository<ApplicationSetting, UUID>, ApplicationSettingRepository {

    @Override
    Optional<ApplicationSetting> findByKey(String key);
}
