import { useState } from 'react';
import { usePreferenceStore, type BackgroundTheme } from '@/stores/preferenceStore';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKGROUND_OPTIONS: { id: BackgroundTheme; name: string; preview: string }[] = [
  { id: 'light-gray', name: 'Light Gray', preview: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)' },
  { id: 'blue-sky', name: 'Blue Sky', preview: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' },
  { id: 'warm-sunset', name: 'Warm Sunset', preview: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)' },
  { id: 'cool-mint', name: 'Cool Mint', preview: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
  { id: 'soft-purple', name: 'Soft Purple', preview: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { backgroundTheme, setBackgroundTheme, showNetworkIndicator, setShowNetworkIndicator } = usePreferenceStore();
  const [tempTheme, setTempTheme] = useState(backgroundTheme);

  if (!isOpen) return null;

  const handleApply = () => {
    setBackgroundTheme(tempTheme);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Call Settings</h2>

        {/* Background Selection */}
        <section className={styles.section}>
          <h3>Background</h3>
          <div className={styles.backgroundGrid}>
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`${styles.backgroundOption} ${tempTheme === option.id ? styles.selected : ''}`}
                onClick={() => setTempTheme(option.id)}
                style={{ background: option.preview }}
              >
                <span className={styles.optionName}>{option.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Network Indicator Toggle */}
        <section className={styles.section}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showNetworkIndicator}
              onChange={(e) => setShowNetworkIndicator(e.target.checked)}
            />
            <span>Show network quality indicator</span>
          </label>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
          <button onClick={handleApply} className={styles.applyButton}>Apply</button>
        </div>
      </div>
    </div>
  );
}
