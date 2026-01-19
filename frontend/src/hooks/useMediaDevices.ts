import { useState, useEffect, useCallback } from 'react';

export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

interface UseMediaDevicesReturn {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  selectedAudioInput: string | null;
  selectedVideoInput: string | null;
  selectedAudioOutput: string | null;
  setSelectedAudioInput: (deviceId: string | null) => void;
  setSelectedVideoInput: (deviceId: string | null) => void;
  setSelectedAudioOutput: (deviceId: string | null) => void;
  refreshDevices: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useMediaDevices(): UseMediaDevicesReturn {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string | null>(null);
  const [selectedVideoInput, setSelectedVideoInput] = useState<string | null>(null);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          // Stop all tracks immediately - we just needed permission
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {
          // Try audio only if video fails
          return navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              stream.getTracks().forEach(track => track.stop());
            });
        });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioIns: MediaDeviceInfo[] = [];
      const videoIns: MediaDeviceInfo[] = [];
      const audioOuts: MediaDeviceInfo[] = [];

      devices.forEach((device, index) => {
        const info: MediaDeviceInfo = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${index + 1}`,
          kind: device.kind as MediaDeviceInfo['kind'],
        };

        if (device.kind === 'audioinput') {
          audioIns.push(info);
        } else if (device.kind === 'videoinput') {
          videoIns.push(info);
        } else if (device.kind === 'audiooutput') {
          audioOuts.push(info);
        }
      });

      setAudioInputs(audioIns);
      setVideoInputs(videoIns);
      setAudioOutputs(audioOuts);

      // Set defaults if not already selected
      if (!selectedAudioInput && audioIns.length > 0) {
        setSelectedAudioInput(audioIns[0].deviceId);
      }
      if (!selectedVideoInput && videoIns.length > 0) {
        setSelectedVideoInput(videoIns[0].deviceId);
      }
      if (!selectedAudioOutput && audioOuts.length > 0) {
        setSelectedAudioOutput(audioOuts[0].deviceId);
      }
    } catch (err) {
      console.error('Error getting media devices:', err);
      setError('Could not access media devices. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAudioInput, selectedVideoInput, selectedAudioOutput]);

  useEffect(() => {
    refreshDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  return {
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    setSelectedAudioInput,
    setSelectedVideoInput,
    setSelectedAudioOutput,
    refreshDevices,
    isLoading,
    error,
  };
}
