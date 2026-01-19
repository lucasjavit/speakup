import { useEffect, useCallback, useState, useRef } from 'react';
import { peerService } from '@/services/peerService';

interface UsePeerConnectionReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isInCall: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  error: Error | null;
  initialize: (userId: string) => Promise<void>;
  call: (remotePeerId: string) => Promise<void>;
  hangUp: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  destroy: () => void;
}

interface UsePeerConnectionOptions {
  onCallConnected?: () => void;
  onCallEnded?: () => void;
  onError?: (error: Error) => void;
}

export function usePeerConnection(options: UsePeerConnectionOptions = {}): UsePeerConnectionReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Setup peer event handlers - these need to be set up before initialize
  // and persist through the component lifecycle
  useEffect(() => {
    console.log('usePeerConnection: setting up event handlers');

    peerService.onRemoteStream((stream) => {
      console.log('usePeerConnection: received remote stream, calling onCallConnected');
      setRemoteStream(stream);
      setIsInCall(true);
      optionsRef.current.onCallConnected?.();
    });

    peerService.onClose(() => {
      console.log('usePeerConnection: call closed');
      setRemoteStream(null);
      setIsInCall(false);
      optionsRef.current.onCallEnded?.();
    });

    peerService.onError((err) => {
      console.log('usePeerConnection: error received', err);
      setError(err);
      optionsRef.current.onError?.(err);
    });

    // Don't destroy on cleanup - let the component manage destruction explicitly
    // This prevents React Strict Mode from breaking the connection
  }, []);

  // Initialize peer connection
  const initialize = useCallback(async (userId: string) => {
    try {
      setError(null);
      console.log('usePeerConnection: initializing with userId:', userId);

      // Get local stream FIRST (before PeerJS init) so it's ready for incoming calls
      console.log('usePeerConnection: getting local stream...');
      const stream = await peerService.getLocalStream();
      setLocalStream(stream);
      setIsAudioEnabled(peerService.isAudioEnabled());
      setIsVideoEnabled(peerService.isVideoEnabled());
      console.log('usePeerConnection: local stream obtained');

      // Now initialize PeerJS
      console.log('usePeerConnection: initializing PeerJS...');
      await peerService.initialize(userId);
      setIsConnected(true);
      console.log('usePeerConnection: PeerJS connected, ready for calls');
    } catch (err) {
      console.error('usePeerConnection: initialization failed:', err);
      const error = err instanceof Error ? err : new Error('Failed to initialize peer');
      setError(error);
      throw error;
    }
  }, []);

  // Call another peer
  const call = useCallback(async (remotePeerId: string) => {
    try {
      setError(null);
      await peerService.call(remotePeerId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to call peer');
      setError(error);
      throw error;
    }
  }, []);

  // Hang up
  const hangUp = useCallback(() => {
    peerService.hangUp();
    setRemoteStream(null);
    setIsInCall(false);
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const newState = !isAudioEnabled;
    peerService.toggleAudio(newState);
    setIsAudioEnabled(newState);
  }, [isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const newState = !isVideoEnabled;
    peerService.toggleVideo(newState);
    setIsVideoEnabled(newState);
  }, [isVideoEnabled]);

  // Destroy connection
  const destroy = useCallback(() => {
    peerService.destroy();
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsInCall(false);
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    isInCall,
    isAudioEnabled,
    isVideoEnabled,
    error,
    initialize,
    call,
    hangUp,
    toggleAudio,
    toggleVideo,
    destroy,
  };
}
