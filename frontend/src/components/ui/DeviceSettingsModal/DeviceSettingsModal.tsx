import { Select } from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import styles from './DeviceSettingsModal.module.css';

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioDevices: MediaDeviceOption[];
  videoDevices: MediaDeviceOption[];
  audioOutputDevices: MediaDeviceOption[];
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  selectedAudioOutputDevice: string;
  onAudioDeviceChange: (deviceId: string) => void;
  onVideoDeviceChange: (deviceId: string) => void;
  onAudioOutputDeviceChange: (deviceId: string) => void;
}

export function DeviceSettingsModal({
  isOpen,
  onClose,
  audioDevices,
  videoDevices,
  audioOutputDevices,
  selectedAudioDevice,
  selectedVideoDevice,
  selectedAudioOutputDevice,
  onAudioDeviceChange,
  onVideoDeviceChange,
  onAudioOutputDeviceChange,
}: DeviceSettingsModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Device Settings</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Microphone */}
          {audioDevices.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <span>Microphone</span>
              </div>
              <Select
                value={selectedAudioDevice}
                onChange={onAudioDeviceChange}
                options={audioDevices.map((device): SelectOption => ({
                  value: device.deviceId,
                  label: device.label,
                }))}
              />
            </div>
          )}

          {/* Camera */}
          {videoDevices.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                <span>Camera</span>
              </div>
              <Select
                value={selectedVideoDevice}
                onChange={onVideoDeviceChange}
                options={videoDevices.map((device): SelectOption => ({
                  value: device.deviceId,
                  label: device.label,
                }))}
              />
            </div>
          )}

          {/* Speaker */}
          {audioOutputDevices.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                <span>Speaker</span>
              </div>
              <Select
                value={selectedAudioOutputDevice}
                onChange={onAudioOutputDeviceChange}
                options={audioOutputDevices.map((device): SelectOption => ({
                  value: device.deviceId,
                  label: device.label,
                }))}
              />
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.doneButton} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
