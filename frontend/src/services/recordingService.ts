import api from '@/lib/axios';

type RecordingState = 'inactive' | 'recording' | 'paused';

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private state: RecordingState = 'inactive';

  // Start recording audio from a stream
  startRecording(stream: MediaStream): void {
    if (this.mediaRecorder && this.state === 'recording') {
      console.warn('Recording already in progress');
      return;
    }

    // Check if stream is active
    if (!stream.active) {
      console.warn('Cannot record from inactive stream');
      return;
    }

    // Extract only audio tracks
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('No audio tracks available for recording');
      return;
    }

    const audioStream = new MediaStream(audioTracks);

    // Determine best supported format
    const mimeType = this.getSupportedMimeType();
    if (!mimeType) {
      console.error('No supported audio format found');
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(audioStream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.state = 'inactive';
      };

      this.mediaRecorder.onstop = () => {
        this.state = 'inactive';
      };

      // Record in 1-second chunks for better reliability
      this.mediaRecorder.start(1000);
      this.state = 'recording';

      console.log('Recording started with format:', mimeType);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop recording and return the blob
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        // Already stopped, return existing chunks
        const blob = this.createBlob();
        resolve(blob);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.state = 'inactive';
        const blob = this.createBlob();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Pause recording
  pauseRecording(): void {
    if (this.mediaRecorder && this.state === 'recording') {
      this.mediaRecorder.pause();
      this.state = 'paused';
    }
  }

  // Resume recording
  resumeRecording(): void {
    if (this.mediaRecorder && this.state === 'paused') {
      this.mediaRecorder.resume();
      this.state = 'recording';
    }
  }

  // Get current recording state
  getState(): RecordingState {
    return this.state;
  }

  // Check if recording is active
  isRecording(): boolean {
    return this.state === 'recording';
  }

  // Upload recording to server
  async uploadRecording(conversationId: string, blob: Blob): Promise<string> {
    try {
      const formData = new FormData();

      // Generate filename with timestamp
      const extension = this.getExtensionFromMimeType(blob.type);
      const filename = `${conversationId}_${Date.now()}.${extension}`;

      formData.append('audio', blob, filename);
      formData.append('conversationId', conversationId);

      const response = await api.post<{ url: string }>('/recordings/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Don't throw on errors - recording upload is optional/deprecated
        validateStatus: () => true,
      });

      if (response.status === 200 || response.status === 201) {
        return response.data.url;
      } else {
        console.warn('Recording upload not available (feature disabled)');
        return '';
      }
    } catch (error) {
      console.warn('Recording upload failed (non-critical):', error);
      return '';
    }
  }

  // Create blob from recorded chunks
  private createBlob(): Blob {
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const blob = new Blob(this.chunks, { type: mimeType });
    this.chunks = [];
    return blob;
  }

  // Get supported MIME type for recording
  private getSupportedMimeType(): string | null {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }

  // Get file extension from MIME type
  private getExtensionFromMimeType(mimeType: string): string {
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4')) return 'mp4';
    return 'audio';
  }

  // Clean up
  destroy(): void {
    if (this.mediaRecorder && this.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.state = 'inactive';
  }
}

// Export singleton instance
export const recordingService = new RecordingService();

// Utility to check if recording is supported
export function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' &&
    (MediaRecorder.isTypeSupported('audio/webm') ||
     MediaRecorder.isTypeSupported('audio/ogg') ||
     MediaRecorder.isTypeSupported('audio/mp4'));
}
