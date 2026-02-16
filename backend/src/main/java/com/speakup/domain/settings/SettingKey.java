package com.speakup.domain.settings;

/**
 * Constants for application setting keys.
 */
public final class SettingKey {

    private SettingKey() {
        // Prevent instantiation
    }

    /**
     * When enabled, users can join sessions without spending credits.
     */
    public static final String FREE_MODE_ENABLED = "FREE_MODE_ENABLED";

    /**
     * Message displayed to users when free mode is active.
     */
    public static final String FREE_MODE_MESSAGE = "FREE_MODE_MESSAGE";

    /**
     * When enabled, sends an email to all users when someone joins the queue and no other users are online.
     */
    public static final String NOTIFY_ON_EMPTY_QUEUE = "NOTIFY_ON_EMPTY_QUEUE";

    /**
     * When enabled, users can access the Settings page to configure their API keys.
     */
    public static final String SETTINGS_PAGE_ENABLED = "SETTINGS_PAGE_ENABLED";

    /**
     * When enabled, users can record and access conversation transcripts.
     */
    public static final String TRANSCRIPT_FEATURE_ENABLED = "TRANSCRIPT_FEATURE_ENABLED";

    /**
     * When enabled, users can report bugs and send feedback through the feedback system.
     */
    public static final String FEEDBACK_FEATURE_ENABLED = "FEEDBACK_FEATURE_ENABLED";
}
