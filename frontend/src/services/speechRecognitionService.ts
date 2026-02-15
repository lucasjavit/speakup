/**
 * Service for speech recognition using Web Speech API.
 * Supports real-time transcription of audio from microphone.
 */

interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

type ResultCallback = (result: SpeechRecognitionResult) => void;
type ErrorCallback = (error: string) => void;

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private resultCallback: ResultCallback | null = null;
  private errorCallback: ErrorCallback | null = null;
  private isRunning = false;

  /**
   * Check if Web Speech API is supported in the current browser.
   */
  isSupported(): boolean {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  /**
   * Initialize the speech recognition service.
   * @param lang Language code (default: en-US)
   * @returns true if initialization was successful
   */
  initialize(lang: string = 'en-US'): boolean {
    if (!this.isSupported()) {
      console.warn('Web Speech API is not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.continuous = true; // Keep listening
    this.recognition.interimResults = true; // Get partial results
    this.recognition.lang = lang;
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;

      if (this.resultCallback) {
        this.resultCallback({
          text: transcript,
          isFinal,
          timestamp: Date.now(),
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      // Don't report "no-speech" errors as they're normal during pauses
      if (event.error !== 'no-speech') {
        if (this.errorCallback) {
          this.errorCallback(event.error);
        }
      }
    };

    this.recognition.onend = () => {
      // Automatically restart if it stopped unexpectedly and we're still running
      if (this.isRunning) {
        console.log('Speech recognition ended unexpectedly, restarting...');
        this.start();
      }
    };

    return true;
  }

  /**
   * Start speech recognition.
   */
  start(): void {
    if (!this.recognition) {
      console.error('Speech recognition not initialized');
      return;
    }

    if (this.isRunning) {
      console.warn('Speech recognition is already running');
      return;
    }

    try {
      this.recognition.start();
      this.isRunning = true;
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop speech recognition.
   */
  stop(): void {
    if (!this.recognition) {
      return;
    }

    this.isRunning = false;
    
    try {
      this.recognition.stop();
      console.log('Speech recognition stopped');
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }

  /**
   * Set callback for recognition results.
   */
  onResult(callback: ResultCallback): void {
    this.resultCallback = callback;
  }

  /**
   * Set callback for errors.
   */
  onError(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  /**
   * Check if recognition is currently running.
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.stop();
    this.recognition = null;
    this.resultCallback = null;
    this.errorCallback = null;
  }
}

// Export singleton instance
export const speechRecognitionService = new SpeechRecognitionService();
