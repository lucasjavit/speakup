import { useEffect, useRef, useState } from 'react';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import styles from './DeviceSelector.module.css';

interface DeviceSelectorProps {
  onDevicesSelected: (audioDeviceId: string | null, videoDeviceId: string | null) => void;
  onCancel: () => void;
}

export function DeviceSelector({ onDevicesSelected, onCancel }: DeviceSelectorProps) {
  const {
    audioInputs,
    videoInputs,
    selectedAudioInput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    refreshDevices,
    isLoading,
    error,
  } = useMediaDevices();

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update preview when device selection changes
  useEffect(() => {
    async function updatePreview() {
      // Stop previous stream
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }

      if (!selectedAudioInput && !selectedVideoInput) {
        setPreviewStream(null);
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {};

        if (selectedAudioInput) {
          constraints.audio = { deviceId: { exact: selectedAudioInput } };
        }

        if (selectedVideoInput) {
          constraints.video = {
            deviceId: { exact: selectedVideoInput },
            width: { ideal: 640 },
            height: { ideal: 480 },
          };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setPreviewStream(stream);
      } catch (err) {
        console.error('Error getting preview stream:', err);
      }
    }

    updatePreview();

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedAudioInput, selectedVideoInput]);

  // Set video source when preview stream changes
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const handleConfirm = () => {
    // Stop preview stream before proceeding
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }
    onDevicesSelected(selectedAudioInput, selectedVideoInput);
  };

  const handleCancel = () => {
    // Stop preview stream
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading devices...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Select Your Devices</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        {/* Video Preview */}
        <div className={styles.previewSection}>
          <div className={styles.videoPreview}>
            {selectedVideoInput ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
              />
            ) : (
              <div className={styles.noVideo}>
                <span>No camera selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Device Selection */}
        <div className={styles.selectorsSection}>
          {/* Camera Selection */}
          <div className={styles.selector}>
            <label htmlFor="camera-select">Camera</label>
            <select
              id="camera-select"
              value={selectedVideoInput || ''}
              onChange={(e) => setSelectedVideoInput(e.target.value || null)}
            >
              <option value="">No camera</option>
              {videoInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div className={styles.selector}>
            <label htmlFor="mic-select">Microphone</label>
            <select
              id="mic-select"
              value={selectedAudioInput || ''}
              onChange={(e) => setSelectedAudioInput(e.target.value || null)}
            >
              <option value="">No microphone</option>
              {audioInputs.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={refreshDevices}
            className={styles.refreshButton}
          >
            Refresh Devices
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={styles.confirmButton}
          disabled={!selectedAudioInput}
        >
          Join Call
        </button>
      </div>

      {!selectedAudioInput && (
        <p className={styles.warning}>
          Please select at least a microphone to join the call.
        </p>
      )}
    </div>
  );
}
