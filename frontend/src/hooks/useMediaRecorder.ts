import { useCallback, useState } from 'react';
import { recordingService, isRecordingSupported } from '@/services/recordingService';

interface UseMediaRecorderReturn {
  isRecording: boolean;
  isSupported: boolean;
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => Promise<Blob | null>;
  uploadRecording: (conversationId: string, blob: Blob) => Promise<string>;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback((stream: MediaStream) => {
    try {
      recordingService.startRecording(stream);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      const blob = await recordingService.stopRecording();
      setIsRecording(false);
      return blob;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      return null;
    }
  }, []);

  const uploadRecording = useCallback(async (conversationId: string, blob: Blob): Promise<string> => {
    return recordingService.uploadRecording(conversationId, blob);
  }, []);

  return {
    isRecording,
    isSupported: isRecordingSupported(),
    startRecording,
    stopRecording,
    uploadRecording,
  };
}
