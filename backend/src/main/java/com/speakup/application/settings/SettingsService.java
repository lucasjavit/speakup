package com.speakup.application.settings;

import com.speakup.application.settings.dto.ApplicationSettingResponse;
import com.speakup.application.settings.dto.FreeModeStatusResponse;
import com.speakup.domain.settings.ApplicationSetting;
import com.speakup.domain.settings.ApplicationSettingRepository;
import com.speakup.domain.settings.SettingKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SettingsService {

    private static final Logger log = LoggerFactory.getLogger(SettingsService.class);

    private final ApplicationSettingRepository settingRepository;

    public SettingsService(ApplicationSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    /**
     * Check if free mode is enabled.
     */
    public boolean isFreeModeEnabled() {
        return settingRepository.findByKey(SettingKey.FREE_MODE_ENABLED)
                .map(ApplicationSetting::getValueAsBoolean)
                .orElse(false);
    }

    /**
     * Get free mode status with message.
     */
    public FreeModeStatusResponse getFreeModeStatus() {
        boolean enabled = settingRepository.findByKey(SettingKey.FREE_MODE_ENABLED)
                .map(ApplicationSetting::getValueAsBoolean)
                .orElse(false);

        String message = settingRepository.findByKey(SettingKey.FREE_MODE_MESSAGE)
                .map(ApplicationSetting::getValue)
                .orElse("");

        return new FreeModeStatusResponse(enabled, message);
    }

    /**
     * Update free mode setting.
     */
    @Transactional
    public FreeModeStatusResponse updateFreeMode(boolean enabled, String message) {
        // Update enabled status
        ApplicationSetting enabledSetting = settingRepository.findByKey(SettingKey.FREE_MODE_ENABLED)
                .orElseGet(() -> new ApplicationSetting(
                        SettingKey.FREE_MODE_ENABLED,
                        "false",
                        "When enabled, users can join sessions without spending credits"
                ));
        enabledSetting.setValueAsBoolean(enabled);
        settingRepository.save(enabledSetting);

        // Update message if provided
        if (message != null) {
            ApplicationSetting messageSetting = settingRepository.findByKey(SettingKey.FREE_MODE_MESSAGE)
                    .orElseGet(() -> new ApplicationSetting(
                            SettingKey.FREE_MODE_MESSAGE,
                            "",
                            "Message displayed to users when free mode is active"
                    ));
            messageSetting.setValue(message);
            settingRepository.save(messageSetting);
        }

        log.info("Free mode updated: enabled={}, message={}", enabled, message);

        return getFreeModeStatus();
    }

    /**
     * Get a setting by key.
     */
    public Optional<ApplicationSettingResponse> getSetting(String key) {
        return settingRepository.findByKey(key)
                .map(ApplicationSettingResponse::from);
    }

    /**
     * Get all settings.
     */
    public List<ApplicationSettingResponse> getAllSettings() {
        return settingRepository.findAll().stream()
                .map(ApplicationSettingResponse::from)
                .toList();
    }

    /**
     * Update a setting value.
     */
    @Transactional
    public ApplicationSettingResponse updateSetting(String key, String value) {
        ApplicationSetting setting = settingRepository.findByKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Setting not found: " + key));

        setting.setValue(value);
        settingRepository.save(setting);

        log.info("Setting updated: key={}, value={}", key, value);

        return ApplicationSettingResponse.from(setting);
    }
}
