import Peer from 'peerjs';
import type { MediaConnection } from 'peerjs';

type StreamHandler = (stream: MediaStream) => void;
type ErrorHandler = (error: Error) => void;
type CloseHandler = () => void;

class PeerService {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreamHandler: StreamHandler | null = null;
  private errorHandler: ErrorHandler | null = null;
  private closeHandler: CloseHandler | null = null;

  // Initialize PeerJS with user ID
  async initialize(userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Clean up existing peer
      this.destroy();

      // Generate a shorter, unique peer ID to avoid issues with long UUIDs
      // PeerJS sometimes has issues with certain ID formats
      const peerId = `sp_${userId.replace(/-/g, '').substring(0, 16)}`;
      console.log('Creating peer with ID:', peerId);

      // Check if we have a custom PeerJS server configured
      const peerServerHost = import.meta.env.VITE_PEERJS_HOST;
      const peerServerPort = import.meta.env.VITE_PEERJS_PORT;

      interface PeerOptions {
        host?: string;
        port?: number;
        path?: string;
        secure?: boolean;
        pingInterval?: number;
        config: RTCConfiguration;
        debug: number;
      }

      const peerOptions: PeerOptions = {
        pingInterval: 5000,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ],
        },
        debug: import.meta.env.DEV ? 2 : 0,
      };

      // Use custom server if configured, otherwise use public server
      if (peerServerHost) {
        console.log('Using custom PeerJS server:', peerServerHost, ':', peerServerPort);
        peerOptions.host = peerServerHost;
        peerOptions.port = peerServerPort ? parseInt(peerServerPort) : 9000;
        peerOptions.path = '/peerjs';
        peerOptions.secure = window.location.protocol === 'https:';
      } else {
        console.log('Using public PeerJS server (0.peerjs.com)');
        peerOptions.secure = true;
      }

      this.peer = new Peer(peerId, peerOptions);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        console.error('PeerJS connection timeout');
        reject(new Error('Connection timeout'));
      }, 15000);

      this.peer.on('open', (id) => {
        clearTimeout(connectionTimeout);
        console.log('PeerJS connected with ID:', id);
        resolve(id);
      });

      this.peer.on('error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('PeerJS error:', error);
        if (this.errorHandler) {
          this.errorHandler(error);
        }
        reject(error);
      });

      this.peer.on('disconnected', () => {
        console.log('PeerJS disconnected, attempting reconnect');
        // Only try to reconnect if peer still exists
        if (this.peer && !this.peer.destroyed) {
          setTimeout(() => {
            this.peer?.reconnect();
          }, 1000);
        }
      });

      // Handle incoming calls
      this.peer.on('call', (call) => {
        console.log('Incoming call from:', call.peer);
        this.handleIncomingCall(call);
      });
    });
  }

  // Selected device IDs
  private selectedAudioDeviceId: string | null = null;
  private selectedVideoDeviceId: string | null = null;

  // Set selected devices
  setSelectedDevices(audioDeviceId: string | null, videoDeviceId: string | null): void {
    this.selectedAudioDeviceId = audioDeviceId;
    this.selectedVideoDeviceId = videoDeviceId;
    console.log('Selected devices - audio:', audioDeviceId, 'video:', videoDeviceId);
  }

  // Get local media stream
  async getLocalStream(video = true, audio = true): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    // Build constraints with selected devices
    const videoConstraints: MediaTrackConstraints | boolean = video ? {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      ...(this.selectedVideoDeviceId ? { deviceId: { exact: this.selectedVideoDeviceId } } : { facingMode: 'user' }),
    } : false;

    const audioConstraints: MediaTrackConstraints | boolean = audio ? {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...(this.selectedAudioDeviceId ? { deviceId: { exact: this.selectedAudioDeviceId } } : {}),
    } : false;

    // Try to get video + audio first
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      console.log('Got local stream with video and audio');
      return this.localStream;
    } catch (error) {
      console.warn('Could not get video+audio, trying audio only:', error);

      // If video fails (e.g., camera in use by another app/browser), try audio only
      if (video && audio) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: audioConstraints,
          });
          console.log('Got local stream with audio only (video unavailable)');
          return this.localStream;
        } catch (audioError) {
          console.error('Could not get audio either:', audioError);
          throw audioError;
        }
      }

      throw error;
    }
  }

  // Call another peer
  async call(remotePeerId: string): Promise<void> {
    if (!this.peer) {
      throw new Error('Peer not initialized');
    }

    if (!this.localStream) {
      await this.getLocalStream();
    }

    console.log('Calling peer:', remotePeerId);
    this.currentCall = this.peer.call(remotePeerId, this.localStream!);
    this.setupCallHandlers(this.currentCall);
  }

  // Handle incoming call
  private async handleIncomingCall(call: MediaConnection): Promise<void> {
    console.log('Incoming call received from:', call.peer);

    // Get local stream if not already available
    if (!this.localStream) {
      console.log('Getting local stream to answer call...');
      try {
        await this.getLocalStream();
      } catch (error) {
        console.error('Failed to get local stream to answer call:', error);
        if (this.errorHandler) {
          this.errorHandler(error instanceof Error ? error : new Error('Failed to get media'));
        }
        return;
      }
    }

    console.log('Answering call from:', call.peer);
    call.answer(this.localStream!);
    this.currentCall = call;
    this.setupCallHandlers(call);
  }

  // Setup call event handlers
  private setupCallHandlers(call: MediaConnection): void {
    call.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (this.remoteStreamHandler) {
        this.remoteStreamHandler(remoteStream);
      }
    });

    call.on('close', () => {
      console.log('Call closed');
      if (this.closeHandler) {
        this.closeHandler();
      }
    });

    call.on('error', (error) => {
      console.error('Call error:', error);
      if (this.errorHandler) {
        this.errorHandler(error);
      }
    });
  }

  // Set handler for remote stream
  onRemoteStream(handler: StreamHandler): void {
    this.remoteStreamHandler = handler;
  }

  // Set handler for errors
  onError(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  // Set handler for call close
  onClose(handler: CloseHandler): void {
    this.closeHandler = handler;
  }

  // Toggle audio
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle video
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Check if audio is enabled
  isAudioEnabled(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack?.enabled ?? false;
  }

  // Check if video is enabled
  isVideoEnabled(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack?.enabled ?? false;
  }

  // Hang up the call
  hangUp(): void {
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }
  }

  // Stop local stream
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  // Get local stream reference
  getLocalStreamRef(): MediaStream | null {
    return this.localStream;
  }

  // Destroy peer connection
  destroy(): void {
    console.log('peerService: destroy called');
    this.hangUp();
    this.stopLocalStream();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // Don't clear handlers - they should persist across reinitializations
    // This is needed because React Strict Mode may cause multiple mount/unmount cycles
  }

  // Full cleanup - use this when completely done with the service
  fullCleanup(): void {
    this.destroy();
    this.remoteStreamHandler = null;
    this.errorHandler = null;
    this.closeHandler = null;
  }

  // Check if peer is connected
  isConnected(): boolean {
    return this.peer !== null && !this.peer.disconnected;
  }

  // Check if in a call
  isInCall(): boolean {
    return this.currentCall !== null && this.currentCall.open;
  }
}

// Export singleton instance
export const peerService = new PeerService();
