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

      // Use full UUID without hyphens to avoid collision risk
      // PeerJS handles long IDs fine, truncating was unnecessary
      const peerId = `sp_${userId.replace(/-/g, '')}`;
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
            // TURN server for NAT traversal (required for ~20% of users behind symmetric NAT)
            // Configure via environment variables for production
            ...(import.meta.env.VITE_TURN_URL ? [{
              urls: import.meta.env.VITE_TURN_URL,
              username: import.meta.env.VITE_TURN_USERNAME || '',
              credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
            }] : []),
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

      // Set a connection timeout (configurable via env)
      const timeoutMs = parseInt(import.meta.env.VITE_PEER_CONNECTION_TIMEOUT || '15000', 10);
      const connectionTimeout = setTimeout(() => {
        console.error('PeerJS connection timeout');
        reject(new Error('Connection timeout'));
      }, timeoutMs);

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

    console.log('getLocalStream: Requesting stream with constraints:', {
      video: videoConstraints,
      audio: audioConstraints,
      selectedVideoDeviceId: this.selectedVideoDeviceId,
      selectedAudioDeviceId: this.selectedAudioDeviceId,
    });

    // Try to get video + audio first
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      });

      console.log('Got local stream with video and audio');
      console.log('Stream tracks:', {
        videoTracks: this.localStream.getVideoTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled, readyState: t.readyState })),
        audioTracks: this.localStream.getAudioTracks().map(t => ({ id: t.id, label: t.label, enabled: t.enabled, readyState: t.readyState })),
      });
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

  // Change audio device during call
  async changeAudioDevice(deviceId: string): Promise<MediaStream> {
    if (!this.localStream) {
      throw new Error('No local stream available');
    }

    try {
      // Get new audio stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const newAudioTrack = newStream.getAudioTracks()[0];
      const oldAudioTrack = this.localStream.getAudioTracks()[0];

      // Replace track in peer connection if in call
      if (this.currentCall && this.currentCall.peerConnection) {
        const senders = this.currentCall.peerConnection.getSenders();
        const audioSender = senders.find(s => s.track?.kind === 'audio');
        if (audioSender) {
          await audioSender.replaceTrack(newAudioTrack);
        }
      }

      // Replace track in local stream
      if (oldAudioTrack) {
        this.localStream.removeTrack(oldAudioTrack);
        oldAudioTrack.stop();
      }
      this.localStream.addTrack(newAudioTrack);

      // Update selected device
      this.selectedAudioDeviceId = deviceId;

      console.log('Audio device changed to:', deviceId);
      return this.localStream;
    } catch (error) {
      console.error('Failed to change audio device:', error);
      throw error;
    }
  }

  // Change video device during call
  async changeVideoDevice(deviceId: string): Promise<MediaStream> {
    if (!this.localStream) {
      throw new Error('No local stream available');
    }

    try {
      // Get new video stream
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = this.localStream.getVideoTracks()[0];

      // Replace track in peer connection if in call
      if (this.currentCall && this.currentCall.peerConnection) {
        const senders = this.currentCall.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
        }
      }

      // Replace track in local stream
      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      this.localStream.addTrack(newVideoTrack);

      // Update selected device
      this.selectedVideoDeviceId = deviceId;

      console.log('Video device changed to:', deviceId);
      return this.localStream;
    } catch (error) {
      console.error('Failed to change video device:', error);
      throw error;
    }
  }

  // Get current selected devices
  getSelectedDevices(): { audioDeviceId: string | null; videoDeviceId: string | null } {
    return {
      audioDeviceId: this.selectedAudioDeviceId,
      videoDeviceId: this.selectedVideoDeviceId,
    };
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

  // Get current RTCPeerConnection for stats (e.g. network quality indicator)
  getPeerConnection(): RTCPeerConnection | null {
    return this.currentCall?.peerConnection ?? null;
  }
}

// Export singleton instance
export const peerService = new PeerService();
