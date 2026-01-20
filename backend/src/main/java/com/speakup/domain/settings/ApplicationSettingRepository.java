package com.speakup.domain.settings;

import java.util.List;
import java.util.Optional;

public interface ApplicationSettingRepository {

    Optional<ApplicationSetting> findByKey(String key);

    List<ApplicationSetting> findAll();

    ApplicationSetting save(ApplicationSetting setting);
}
