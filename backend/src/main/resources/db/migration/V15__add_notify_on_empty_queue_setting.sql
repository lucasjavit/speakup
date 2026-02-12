-- Setting to control whether to send email notifications when a user joins an empty queue
INSERT INTO application_settings (setting_key, setting_value, description) VALUES
    ('NOTIFY_ON_EMPTY_QUEUE', 'false', 'When enabled, sends an email to all users when someone joins the queue and no other users are online');
