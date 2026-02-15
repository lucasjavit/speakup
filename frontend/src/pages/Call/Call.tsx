import { NetworkQualityIndicator } from '@/components/ui/NetworkQualityIndicator/NetworkQualityIndicator';
import { DeviceSelector } from '@/components/video/DeviceSelector';
import { useCallTimer, useMediaRecorder, usePeerConnection, useWebSocket } from '@/hooks';
import { conversationService, peerService } from '@/services';
import { speechRecognitionService } from '@/services/speechRecognitionService';
import { transcriptService, type TranscriptEntry } from '@/services/transcriptService';
import { useAuthStore } from '@/stores/authStore';
import { useCallStore } from '@/stores/callStore';
import { usePreferenceStore } from '@/stores/preferenceStore';
import { getCountryFlag } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import styles from './Call.module.css';

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

const RECONNECTION_TIMEOUT_SECONDS = 10;

export function Call() {
  const navigate = useNavigate();
  const {
    callInfo,
    callState,
    setCallState,
    endCall,
    isWaitingReconnection,
    disconnectedPartnerName,
    setWaitingReconnection,
    clearReconnectionState,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(true);
  const [devicesSelected, setDevicesSelected] = useState(false);
  const [reconnectionCountdown, setReconnectionCountdown] = useState(0);

  // Country flags
  const [partnerFlag, setPartnerFlag] = useState<{ flagUrl: string; nativeName: string } | null>(null);
  const [myFlag, setMyFlag] = useState<{ flagUrl: string; nativeName: string } | null>(null);
  const { user } = useAuthStore();

  // Transcript states
  const [isRecording, setIsRecording] = useState(false);
  const [partnerRecording, setPartnerRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [quotaAvailable, setQuotaAvailable] = useState(2);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  // Layout mode state
  type LayoutMode = 'spotlight' | 'side-equal' | 'side-70-30';
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('spotlight');
  const [swapVideos, setSwapVideos] = useState(false);

  // Preferences
  const { backgroundTheme, setBackgroundTheme, showNetworkIndicator, layoutMode: preferredLayoutMode, setLayoutMode: setPreferredLayoutMode } = usePreferenceStore();

  // Device selector state
  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioOutputDevice, setSelectedAudioOutputDevice] = useState<string>('');

  const reconnectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceSelectorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCallEndRef = useRef<((reason: 'timer' | 'user_left' | 'partner_left' | 'peer_closed' | 'error') => void) | null>(null);
  const notifyCallEndedRef = useRef<((conversationId: string, reason: 'TIMER' | 'USER_LEFT' | 'ERROR') => void) | null>(null);
  // Refs so transcript save always uses latest values (handleCallEnd can run twice: peer_closed + timer)
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const callInfoRef = useRef<typeof callInfo>(null);
  const isRecordingRef = useRef(false);
  const hasRecordedRef = useRef(false); // true once user started recording (stays true even after stop)
  const includeAnalysisRef = useRef(false);
  const transcriptSavedRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);

  // Handle partner reconnection
  const handlePartnerReconnected = useCallback(() => {
    console.log('Partner reconnected!');
    if (reconnectionTimerRef.current) {
      clearInterval(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
    clearReconnectionState();
    setReconnectionCountdown(0);
  }, [clearReconnectionState]);

  // Handle reconnection timeout
  const handleReconnectionTimeout = useCallback(() => {
    console.log('Reconnection timeout - ending call');
    if (reconnectionTimerRef.current) {
      clearInterval(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
    clearReconnectionState();
    // Use ref to call handleCallEnd since it's defined later
    if (handleCallEndRef.current) {
      handleCallEndRef.current('partner_left');
    } else {
      // Fallback: navigate directly
      navigate('/');
    }
  }, [clearReconnectionState, navigate]);

  // Handle partner disconnection - start waiting for reconnection
  const handlePartnerDisconnected = useCallback(() => {
    console.log('Partner disconnected');

    // If still in device selector, partner left before call started - go to break without evaluation
    if (showDeviceSelector) {
      console.log('Partner left during device selection - going to break without evaluation');
      setShowDeviceSelector(false);
      setCallState('ended');
      endCall();

      if (callInfo && notifyCallEndedRef.current) {
        conversationService.endConversation(callInfo.conversationId, false);
        notifyCallEndedRef.current(callInfo.conversationId, 'ERROR');
      }

      navigate('/break', {
        state: {
          skipEvaluation: true,
          conversationId: callInfo?.conversationId,
          wasInCall: false // User was still in device selector
        }
      });
      return;
    }

    // If call already started, start reconnection timer
    console.log('Partner disconnected during call, starting reconnection timer');
    setWaitingReconnection(true, callInfo?.partnerName, RECONNECTION_TIMEOUT_SECONDS);
    setReconnectionCountdown(RECONNECTION_TIMEOUT_SECONDS);

    // Start countdown timer
    reconnectionTimerRef.current = setInterval(() => {
      setReconnectionCountdown(prev => {
        if (prev <= 1) {
          // Time's up - end the call
          handleReconnectionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [showDeviceSelector, callInfo, setWaitingReconnection, handleReconnectionTimeout, endCall, navigate]);

  // Layout control functions (sync with preference store)
  const toggleLayout = useCallback(() => {
    setLayoutMode(current => {
      const next = current === 'spotlight' ? 'side-equal' : current === 'side-equal' ? 'side-70-30' : 'spotlight';
      setPreferredLayoutMode(next);
      return next;
    });
  }, [setPreferredLayoutMode]);

  const handleSwapVideos = useCallback(() => {
    setSwapVideos(prev => !prev);
  }, []);

  // Cycle background: light-gray -> dark -> white -> light-gray
  const BACKGROUND_CYCLE = ['light-gray', 'dark', 'white'] as const;
  const cycleBackground = useCallback(() => {
    const idx = BACKGROUND_CYCLE.indexOf(backgroundTheme as typeof BACKGROUND_CYCLE[number]);
    const next = BACKGROUND_CYCLE[(idx + 1) % BACKGROUND_CYCLE.length];
    setBackgroundTheme(next);
  }, [backgroundTheme, setBackgroundTheme]);

  // Handle call ended with error (partner didn't join) - go to break without evaluation
  const handleCallEndedWithError = useCallback(() => {
    console.log('Call ended with error - partner did not join. Going to break without evaluation.');
    const wasInCall = !showDeviceSelector; // If not in device selector, user was in call
    setShowDeviceSelector(false);
    setCallState('ended');
    endCall();

    // Navigate to break without evaluation
    navigate('/break', {
      state: {
        skipEvaluation: true,
        conversationId: callInfo?.conversationId,
        wasInCall // Pass flag to show appropriate message
      }
    });
  }, [callInfo, endCall, navigate, showDeviceSelector]);

  // WebSocket for notifications
  const { notifyCallEnded } = useWebSocket({
    onPartnerDisconnected: handlePartnerDisconnected,
    onPartnerReconnected: handlePartnerReconnected,
    onReconnectionTimeout: handleReconnectionTimeout,
    onCallEndedWithError: handleCallEndedWithError,
  });

  // Update ref when notifyCallEnded is available
  useEffect(() => {
    notifyCallEndedRef.current = notifyCallEnded;
  }, [notifyCallEnded]);

  // Cleanup reconnection timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectionTimerRef.current) {
        clearInterval(reconnectionTimerRef.current);
      }
      if (deviceSelectorTimeoutRef.current) {
        clearTimeout(deviceSelectorTimeoutRef.current);
      }
    };
  }, []);

  // Timeout for device selection (30 seconds)
  useEffect(() => {
    if (showDeviceSelector && callInfo) {
      console.log('Starting device selector timeout (30s)');
      deviceSelectorTimeoutRef.current = setTimeout(() => {
        console.log('Device selector timeout - going to break without evaluation');
        setShowDeviceSelector(false);
        setCallState('ended');
        endCall();

        // Notify backend to cancel
        if (callInfo && notifyCallEndedRef.current) {
          conversationService.endConversation(callInfo.conversationId, false);
          notifyCallEndedRef.current(callInfo.conversationId, 'ERROR');
        }

        navigate('/break', {
          state: {
            skipEvaluation: true,
            conversationId: callInfo?.conversationId,
            wasInCall: false // Timeout happened in device selector
          }
        });
      }, 30000); // 30 seconds

      return () => {
        if (deviceSelectorTimeoutRef.current) {
          clearTimeout(deviceSelectorTimeoutRef.current);
        }
      };
    }
  }, [showDeviceSelector, callInfo, endCall, navigate]);

  // Peer connection
  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    error: peerError,
    initialize,
    call,
    hangUp,
    toggleAudio,
    toggleVideo,
    changeAudioDevice,
    changeVideoDevice,
    destroy,
  } = usePeerConnection({
    onCallConnected: () => {
      setCallState('connected');
      timer.start();
      // Start recording if enabled and stream is active
      if (localStream && localStream.active && recorder.isSupported) {
        try {
          recorder.startRecording(localStream);
        } catch (err) {
          console.warn('Could not start recording:', err);
        }
      }
      // Notify backend
      if (callInfo) {
        conversationService.startConversation(callInfo.conversationId);
      }
    },
    onCallEnded: () => {
      handleCallEnd('peer_closed');
    },
    onError: (error) => {
      console.error('Peer error:', error);
      handleCallEnd('error');
    },
  });

  // Call timer (configurable duration from session, default 10 minutes)
  const timer = useCallTimer({
    duration: callInfo?.callDurationSeconds || 600,
    onTimeUp: () => {
      handleCallEnd('timer');
    },
    onWarning: (seconds) => {
      console.log(`Warning: ${seconds} seconds remaining`);
    },
    warningAt: 60,
  });

  // Recording
  const recorder = useMediaRecorder();

  // Check speech recognition support on mount
  useEffect(() => {
    const supported = speechRecognitionService.isSupported();
    setIsSpeechSupported(supported);
    
    if (!supported) {
      toast('Speech recognition is not supported in this browser. Please use Chrome or Edge for transcription feature.', {
        duration: 5000,
        icon: '⚠️',
      });
    }
  }, []);

  // Fetch quota on mount and when recording state changes
  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const quota = await transcriptService.getQuota();
        setQuotaAvailable(quota.available);
        console.log('Transcript quota:', quota);
      } catch (error) {
        console.error('Failed to fetch transcript quota:', error);
      }
    };
    fetchQuota();
  }, [isRecording]); // Refetch when recording state changes

  // Setup speech recognition when recording starts
  useEffect(() => {
    if (!isRecording || !localStream || !isSpeechSupported) {
      return;
    }

    console.log('Starting speech recognition...');
    const initialized = speechRecognitionService.initialize('en-US');
    
    if (!initialized) {
      toast.error('Failed to initialize speech recognition');
      setIsRecording(false);
      return;
    }

    speechRecognitionService.onResult((result) => {
      if (result.isFinal) {
        const entry: TranscriptEntry = {
          speaker: 'You',
          text: result.text,
          timestamp: result.timestamp,
        };
        
        setTranscript(prev => [...prev, entry]);
        
        // Send to partner via DataChannel
        peerService.sendDataMessage({
          type: 'transcript-chunk',
          text: result.text,
          timestamp: result.timestamp,
        });
      }
    });

    speechRecognitionService.onError((error) => {
      console.error('Speech recognition error:', error);
    });

    speechRecognitionService.start();

    return () => {
      speechRecognitionService.stop();
      speechRecognitionService.destroy();
    };
  }, [isRecording, localStream, isSpeechSupported]);

  // Setup DataChannel message handler
  useEffect(() => {
    peerService.onDataMessage((message) => {
      if (message.type === 'recording-started') {
        setPartnerRecording(true);
        toast(`${callInfo?.partnerName || 'Partner'} started recording`, {
          icon: '🎙️',
          duration: 3000,
        });
      } else if (message.type === 'recording-stopped') {
        setPartnerRecording(false);
      } else if (message.type === 'transcript-chunk') {
        const entry: TranscriptEntry = {
          speaker: callInfo?.partnerName || 'Partner',
          text: message.text,
          timestamp: message.timestamp,
        };
        setTranscript(prev => [...prev, entry]);
      }
    });
  }, [callInfo?.partnerName]);

  // Keep refs in sync so transcript save works even when handleCallEnd runs twice (peer_closed + timer)
  transcriptRef.current = transcript;
  callInfoRef.current = callInfo ?? null;
  isRecordingRef.current = isRecording;
  includeAnalysisRef.current = false; // analysis is requested later from Conversations page

  // Reset "already saved" flag when starting a new conversation
  if (callInfo?.conversationId !== conversationIdRef.current) {
    conversationIdRef.current = callInfo?.conversationId ?? null;
    transcriptSavedRef.current = false;
    hasRecordedRef.current = false;
  }

  // Track if we've started setup to avoid duplicate initialization
  const setupStartedRef = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle device selection
  const handleDevicesSelected = async (audioDeviceId: string | null, videoDeviceId: string | null, audioOutputDeviceId: string | null) => {
    console.log('Devices selected - audio:', audioDeviceId, 'video:', videoDeviceId, 'audioOutput:', audioOutputDeviceId);
    peerService.setSelectedDevices(audioDeviceId, videoDeviceId);
    
    // Set audio output device if selected
    if (audioOutputDeviceId) {
      setSelectedAudioOutputDevice(audioOutputDeviceId);
      // If remote video already exists, apply the audio output device
      if (remoteVideoRef.current && 'setSinkId' in remoteVideoRef.current) {
        try {
          await (remoteVideoRef.current as any).setSinkId(audioOutputDeviceId);
          console.log('Audio output device set on device selection:', audioOutputDeviceId);
        } catch (err) {
          console.error('Failed to set audio output device:', err);
        }
      }
    }
    
    setShowDeviceSelector(false);
    setDevicesSelected(true);
  };

  const handleDeviceSelectorCancel = () => {
    // Go back to lobby if user cancels
    navigate('/');
  };

  // Initialize peer connection after devices are selected
  useEffect(() => {
    // Don't start if devices haven't been selected yet
    if (!devicesSelected) {
      return;
    }

    // Clear any pending redirect
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Get current callInfo from store (in case it updated after initial render)
    const currentCallInfo = useCallStore.getState().callInfo;

    console.log('Call useEffect - callInfo:', callInfo, 'currentCallInfo:', currentCallInfo);

    const info = callInfo || currentCallInfo;

    if (!info) {
      // Wait a bit before redirecting - state might still be propagating
      console.log('No callInfo yet, waiting...');
      redirectTimeoutRef.current = setTimeout(() => {
        const latestCallInfo = useCallStore.getState().callInfo;
        if (!latestCallInfo) {
          console.log('Still no callInfo after wait, redirecting to home');
          navigate('/');
        }
      }, 500);
      return;
    }

    // Prevent duplicate setup
    if (setupStartedRef.current) {
      console.log('Setup already started, skipping');
      return;
    }
    setupStartedRef.current = true;

    async function setupCall() {
      try {
        // Get current user ID for PeerJS initialization
        const currentUser = useAuthStore.getState().user;
        if (!currentUser?.id) {
          console.error('No user ID available for peer connection');
          handleCallEnd('error');
          return;
        }

        setCallState('connecting');
        console.log('Initializing PeerJS with user ID:', currentUser.id);
        await initialize(currentUser.id);

        // If initiator, start the call
        if (info!.isInitiator) {
          // Convert partner's UUID to the same format used by PeerJS (full UUID without hyphens)
          const partnerPeerId = `sp_${info!.peerId.replace(/-/g, '')}`;
          // Small delay to ensure the other peer is ready
          console.log('Initiator: calling peer', partnerPeerId, '(original:', info!.peerId, ')');
          setTimeout(() => {
            call(partnerPeerId);
          }, 3000); // Increased delay to ensure both peers are ready
        } else {
          const myPeerId = `sp_${currentUser.id.replace(/-/g, '')}`;
          console.log('Receiver: my peer ID is', myPeerId, ', waiting for incoming call');
        }
      } catch (error) {
        console.error('Failed to setup call:', error);
        // Don't immediately redirect on error - show error to user
        setCallState('ended');
      }
    }

    setupCall();

    return () => {
      console.log('Call useEffect cleanup running');
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
      // Only destroy if we're actually leaving the call page
      // Don't destroy on React Strict Mode double-mount
    };
  }, [devicesSelected]);

  // Ref callbacks: assign stream as soon as the video element is mounted (fixes one user not seeing own video)
  const setLocalVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
      if (el && localStream) el.srcObject = localStream;
    },
    [localStream]
  );
  const setRemoteVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (remoteVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
      if (el && remoteStream) el.srcObject = remoteStream;
    },
    [remoteStream]
  );

  // Update video elements when streams or layout change (backup for ref callbacks)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, layoutMode, swapVideos]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, layoutMode, swapVideos]);

  // When localStream first becomes available, re-apply after paint so the ref is definitely set (fix: own video only shows after changing layout)
  useEffect(() => {
    if (!localStream) return;
    const apply = () => {
      if (localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    };
    apply();
    const raf = requestAnimationFrame(apply);
    const t = setTimeout(apply, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [localStream]);

  // Sync layout mode with preference store (load on mount)
  useEffect(() => {
    setLayoutMode(preferredLayoutMode);
  }, [preferredLayoutMode]);

  // Resolve country flags
  useEffect(() => {
    if (callInfo?.partnerCountry) {
      getCountryFlag(callInfo.partnerCountry).then((info) => info && setPartnerFlag(info));
    }
    if (user?.country) {
      getCountryFlag(user.country).then((info) => info && setMyFlag(info));
    }
  }, [callInfo?.partnerCountry, user?.country]);

  // Enumerate available devices when call is connected
  useEffect(() => {
    if (callState !== 'connected') return;

    const enumerateDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const audioInputs = devices
          .filter(d => d.kind === 'audioinput' && d.deviceId)
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Microphone ${d.deviceId.slice(0, 5)}` }));

        const videoInputs = devices
          .filter(d => d.kind === 'videoinput' && d.deviceId)
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}` }));

        const audioOutputs = devices
          .filter(d => d.kind === 'audiooutput' && d.deviceId)
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 5)}` }));

        setAudioDevices(audioInputs);
        setVideoDevices(videoInputs);
        setAudioOutputDevices(audioOutputs);

        // Set initial selected devices
        const { audioDeviceId, videoDeviceId } = peerService.getSelectedDevices();
        if (audioDeviceId) {
          setSelectedAudioDevice(audioDeviceId);
        } else if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
        if (videoDeviceId) {
          setSelectedVideoDevice(videoDeviceId);
        } else if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        if (audioOutputs.length > 0) {
          setSelectedAudioOutputDevice(audioOutputs[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    };

    enumerateDevices();
  }, [callState]);

  // Handle audio device change
  const handleAudioDeviceChange = async (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    try {
      await changeAudioDevice(deviceId);
    } catch (err) {
      console.error('Failed to change audio device:', err);
    }
  };

  // Handle video device change
  const handleVideoDeviceChange = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    try {
      await changeVideoDevice(deviceId);
    } catch (err) {
      console.error('Failed to change video device:', err);
    }
  };

  // Handle audio output device change
  const handleAudioOutputDeviceChange = async (deviceId: string) => {
    setSelectedAudioOutputDevice(deviceId);
    try {
      // Apply to remote video element (partner's audio)
      if (remoteVideoRef.current && 'setSinkId' in remoteVideoRef.current) {
        await (remoteVideoRef.current as any).setSinkId(deviceId);
        console.log('Audio output device changed to:', deviceId);
      }
    } catch (err) {
      console.error('Failed to change audio output device:', err);
    }
  };

  // Handle transcript activation (one-click, no toggle - records until call ends)
  const handleTranscriptToggle = () => {
    setIsRecording(true);
    hasRecordedRef.current = true;
    setTranscript([]);
    peerService.sendDataMessage({ type: 'recording-started' });
    toast.success('Transcript will be saved at end of call');
  };

  const handleCallEnd = async (reason: 'timer' | 'user_left' | 'partner_left' | 'peer_closed' | 'error') => {
    console.log('handleCallEnd called with reason:', reason);

    // Save transcript once using refs (handleCallEnd can run twice: peer_closed then timer)
    // Use hasRecordedRef (not isRecordingRef) because user may have stopped recording before call ended
    const info = callInfoRef.current;
    const shouldSave =
      !transcriptSavedRef.current &&
      hasRecordedRef.current &&
      transcriptRef.current.length > 0 &&
      info;
    if (shouldSave && info) {
      transcriptSavedRef.current = true;
      try {
        await transcriptService.saveTranscript({
          conversationId: info.conversationId,
          transcriptData: JSON.stringify(transcriptRef.current),
          includeAnalysis: false,
        });
        toast.success('Transcript saved successfully!');
      } catch (error: any) {
        transcriptSavedRef.current = false; // allow retry if another handleCallEnd runs
        if (error.response?.status === 429) {
          toast.error('Daily transcript limit reached');
        } else {
          console.error('Failed to save transcript:', error);
          toast.error('Failed to save transcript');
        }
      }
    }

    // Stop recording
    if (isRecordingRef.current) {
      setIsRecording(false);
      speechRecognitionService.stop();
    }

    // Clear reconnection timer if active
    if (reconnectionTimerRef.current) {
      clearInterval(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
    clearReconnectionState();

    // Capture elapsed time before pausing
    const elapsedSeconds = timer.timeElapsed;

    timer.pause();
    hangUp();
    destroy(); // Clean up peer connection

    // Check if call actually started (connected and had meaningful duration)
    const callActuallyStarted = callState === 'connected' && elapsedSeconds > 5;

    // If call didn't start or had an error early on, go to break without evaluation
    if (!callActuallyStarted || reason === 'error') {
      console.log('Call did not properly start, going to break without evaluation');
      setCallState('ended');
      endCall();

      // Notify backend to cancel the conversation
      if (callInfo) {
        await conversationService.endConversation(callInfo.conversationId, false);
        if (notifyCallEndedRef.current) {
          notifyCallEndedRef.current(callInfo.conversationId, 'ERROR');
        }
      }

      // Navigate to break without evaluation
      // wasInCall: true if we got past device selection (callState was 'connected')
      navigate('/break', {
        state: {
          skipEvaluation: true,
          conversationId: callInfo?.conversationId,
          wasInCall: callState === 'connected'
        }
      });
      return;
    }

    // Stop recording (upload disabled - feature not implemented in backend)
    if (recorder.isRecording) {
      try {
        await recorder.stopRecording();
        // Upload is disabled - backend endpoint doesn't exist
      } catch (error) {
        console.warn('Failed to stop recording:', error);
      }
    }

    // Notify backend
    if (callInfo) {
      const completed = reason === 'timer' || reason === 'user_left';
      await conversationService.endConversation(callInfo.conversationId, completed);
      const wsReason: 'TIMER' | 'USER_LEFT' | 'ERROR' = reason === 'timer' ? 'TIMER' : reason === 'partner_left' || reason === 'user_left' ? 'USER_LEFT' : 'ERROR';
      notifyCallEnded(callInfo.conversationId, wsReason);
    }

    setCallState('ended');
    endCall();

    // Navigate to break screen with call summary
    navigate('/break', {
      state: {
        conversationId: callInfo?.conversationId || '',
        partnerId: callInfo?.peerId || '',
        partnerName: callInfo?.partnerName || 'Partner',
        partnerAvatar: callInfo?.partnerAvatar || null,
        topic: callInfo?.topic || '',
        duration: elapsedSeconds,
        sessionId: callInfo?.sessionId || '',
        breakDurationSeconds: callInfo?.breakDurationSeconds || 30,
      }
    });
  };

  // Store handleCallEnd in ref for use in callbacks
  handleCallEndRef.current = handleCallEnd;

  const handleLeaveClick = () => {
    setShowEndConfirm(true);
  };

  const confirmLeave = () => {
    handleCallEnd('user_left');
  };

  if (!callInfo) {
    // Show loading while waiting for callInfo to propagate
    return (
      <div className={styles.container}>
        <div className={styles.videoPlaceholder}>
          <p>Loading call...</p>
        </div>
      </div>
    );
  }

  // Show connection error with retry option
  if (peerError || callState === 'ended') {
    return (
      <div className={styles.container}>
        <div className={styles.videoPlaceholder}>
          <h2>Connection Error</h2>
          <p>{peerError?.message || 'Failed to establish video connection'}</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setupStartedRef.current = false;
                setCallState('idle');
                window.location.reload();
              }}
              style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/')}
              style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show device selector before starting the call
  if (showDeviceSelector) {
    return (
      <div className={styles.container}>
        <div className={styles.deviceSelectorWrapper}>
          <DeviceSelector
            onDevicesSelected={handleDevicesSelected}
            onCancel={handleDeviceSelectorCancel}
          />
        </div>
      </div>
    );
  }

  // Show waiting for partner reconnection overlay
  const renderReconnectionOverlay = () => {
    if (!isWaitingReconnection) return null;

    return (
      <div className={styles.reconnectionOverlay}>
        <div className={styles.reconnectionDialog}>
          <div className={styles.reconnectionSpinner} />
          <h3>Partner Disconnected</h3>
          <p>
            {disconnectedPartnerName || 'Your partner'} lost connection.
            <br />
            Waiting for them to reconnect...
          </p>
          <div className={styles.reconnectionCountdown}>
            <span className={styles.countdownNumber}>{reconnectionCountdown}</span>
            <span className={styles.countdownLabel}>seconds remaining</span>
          </div>
          <button
            onClick={() => {
              if (reconnectionTimerRef.current) {
                clearInterval(reconnectionTimerRef.current);
                reconnectionTimerRef.current = null;
              }
              handleCallEnd('user_left');
            }}
            className={styles.leaveNowButton}
          >
            Leave Now
          </button>
        </div>
      </div>
    );
  };

  // Peer connection for network quality indicator (when in call)
  const peerConnection = callState === 'connected' ? peerService.getPeerConnection() : null;

  return (
    <div className={`${styles.container} ${styles[`bg-${backgroundTheme}`]}`}>
      {/* Topic Banner */}
      <div className={styles.topicBanner}>
        <span className={styles.topicLabel}>Topic:</span>
        <span className={styles.topicText}>{callInfo.topic}</span>
      </div>

      {/* Network quality indicator (when enabled in settings and call is connected) */}
      {showNetworkIndicator && peerConnection && (
        <div className={styles.networkIndicatorWrapper}>
          <NetworkQualityIndicator peerConnection={peerConnection} />
        </div>
      )}

      {/* Video Grid */}
      <div className={`${styles.videoGrid} ${styles[`layout-${layoutMode}`]}`}>
        {/* Spotlight Mode */}
        {layoutMode === 'spotlight' && (
          <>
            {/* Remote Video (Partner) - Main */}
            <div className={styles.videoContainer}>
              <video
                ref={setRemoteVideoRef}
                autoPlay
                playsInline
                className={styles.remoteVideo}
              />
              {!remoteStream && (
                <div className={styles.videoPlaceholder}>
                  <div className={styles.avatar}>
                    {callInfo.partnerAvatar ? (
                      <img src={callInfo.partnerAvatar} alt={callInfo.partnerName} />
                    ) : (
                      <span>{callInfo.partnerName[0]}</span>
                    )}
                  </div>
                  <p>{callInfo.partnerName}</p>
                  {callState === 'connecting' && <span>Connecting...</span>}
                </div>
              )}
              {partnerFlag && <img src={partnerFlag.flagUrl} alt={partnerFlag.nativeName} title={partnerFlag.nativeName} className={styles.countryFlag} />}
              <div className={styles.nameTag}>{callInfo.partnerName}</div>
            </div>

            {/* Local Video (Self) - PiP */}
            <div className={styles.localVideoWrapper}>
              <video
                ref={setLocalVideoRef}
                autoPlay
                playsInline
                muted
                className={styles.localVideo}
              />
              {!isVideoEnabled && (
                <div className={styles.cameraOff}>
                  <span>Camera Off</span>
                </div>
              )}
              {myFlag && <img src={myFlag.flagUrl} alt={myFlag.nativeName} title={myFlag.nativeName} className={styles.countryFlagLocal} />}
              <div className={styles.nameTagLocal}>You</div>
            </div>
          </>
        )}

        {/* Side-by-Side Equal Mode */}
        {layoutMode === 'side-equal' && (
          <div className={styles.sideBySideContainer}>
            <div className={styles.videoBox}>
              <video
                ref={setRemoteVideoRef}
                autoPlay
                playsInline
                className={styles.video}
              />
              {!remoteStream && (
                <div className={styles.videoPlaceholder}>
                  <div className={styles.avatar}>
                    {callInfo.partnerAvatar ? (
                      <img src={callInfo.partnerAvatar} alt={callInfo.partnerName} />
                    ) : (
                      <span>{callInfo.partnerName[0]}</span>
                    )}
                  </div>
                  <p>{callInfo.partnerName}</p>
                </div>
              )}
              {partnerFlag && <img src={partnerFlag.flagUrl} alt={partnerFlag.nativeName} title={partnerFlag.nativeName} className={styles.countryFlag} />}
              <div className={styles.nameTag}>{callInfo.partnerName}</div>
            </div>

            <div className={styles.videoBox}>
              <video
                ref={setLocalVideoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
              />
              {!isVideoEnabled && (
                <div className={styles.cameraOff}>
                  <span>Camera Off</span>
                </div>
              )}
              {myFlag && <img src={myFlag.flagUrl} alt={myFlag.nativeName} title={myFlag.nativeName} className={styles.countryFlag} />}
              <div className={styles.nameTag}>You</div>
            </div>
          </div>
        )}

        {/* Side-by-Side 70/30 Mode */}
        {layoutMode === 'side-70-30' && (
          <div className={styles.sideBySideContainer}>
            {/* Larger video (70%) - can be swapped */}
            <div className={`${styles.videoBox} ${styles.video70}`}>
              <video
                ref={swapVideos ? setLocalVideoRef : setRemoteVideoRef}
                autoPlay
                playsInline
                muted={swapVideos}
                className={styles.video}
              />
              {swapVideos ? (
                !isVideoEnabled && (
                  <div className={styles.cameraOff}>
                    <span>Camera Off</span>
                  </div>
                )
              ) : (
                !remoteStream && (
                  <div className={styles.videoPlaceholder}>
                    <div className={styles.avatar}>
                      {callInfo.partnerAvatar ? (
                        <img src={callInfo.partnerAvatar} alt={callInfo.partnerName} />
                      ) : (
                        <span>{callInfo.partnerName[0]}</span>
                      )}
                    </div>
                    <p>{callInfo.partnerName}</p>
                  </div>
                )
              )}
              {(swapVideos ? myFlag : partnerFlag) && (
                <img src={(swapVideos ? myFlag : partnerFlag)!.flagUrl} alt={(swapVideos ? myFlag : partnerFlag)!.nativeName} title={(swapVideos ? myFlag : partnerFlag)!.nativeName} className={styles.countryFlag} />
              )}
              <div className={styles.nameTag}>
                {swapVideos ? 'You' : callInfo.partnerName}
              </div>
            </div>

            {/* Smaller video (30%) */}
            <div className={`${styles.videoBox} ${styles.video30}`}>
              <video
                ref={swapVideos ? setRemoteVideoRef : setLocalVideoRef}
                autoPlay
                playsInline
                muted={!swapVideos}
                className={styles.video}
              />
              {swapVideos ? (
                !remoteStream && (
                  <div className={styles.videoPlaceholder}>
                    <div className={styles.avatar}>
                      {callInfo.partnerAvatar ? (
                        <img src={callInfo.partnerAvatar} alt={callInfo.partnerName} />
                      ) : (
                        <span>{callInfo.partnerName[0]}</span>
                      )}
                    </div>
                    <p>{callInfo.partnerName}</p>
                  </div>
                )
              ) : (
                !isVideoEnabled && (
                  <div className={styles.cameraOff}>
                    <span>Camera Off</span>
                  </div>
                )
              )}
              {(swapVideos ? partnerFlag : myFlag) && (
                <img src={(swapVideos ? partnerFlag : myFlag)!.flagUrl} alt={(swapVideos ? partnerFlag : myFlag)!.nativeName} title={(swapVideos ? partnerFlag : myFlag)!.nativeName} className={styles.countryFlag} />
              )}
              <div className={styles.nameTag}>
                {swapVideos ? callInfo.partnerName : 'You'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timer */}
      <div className={styles.timer}>
        <span className={timer.timeRemaining <= 60 ? styles.timerWarning : ''}>
          {timer.formattedTimeRemaining}
        </span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Device Selectors */}
        {callState === 'connected' && (audioDevices.length > 1 || videoDevices.length > 1 || audioOutputDevices.length > 1) && (
          <div className={styles.deviceSelectors}>
            {audioDevices.length > 1 && (
              <div className={styles.deviceSelect}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.deviceIcon}>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                </svg>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => handleAudioDeviceChange(e.target.value)}
                  className={styles.select}
                  title="Select microphone"
                >
                  {audioDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {videoDevices.length > 1 && (
              <div className={styles.deviceSelect}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.deviceIcon}>
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                </svg>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => handleVideoDeviceChange(e.target.value)}
                  className={styles.select}
                  title="Select camera"
                >
                  {videoDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {audioOutputDevices.length > 1 && (
              <div className={styles.deviceSelect}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={styles.deviceIcon}>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
                <select
                  value={selectedAudioOutputDevice}
                  onChange={(e) => handleAudioOutputDeviceChange(e.target.value)}
                  className={styles.select}
                  title="Select speaker"
                >
                  {audioOutputDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className={styles.controlButtons}>
          <button
            onClick={toggleAudio}
            className={`${styles.controlButton} ${!isAudioEnabled ? styles.disabled : ''}`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.03 2.47 5.5 5.5 5.5S17 11.03 17 8h2c0 4.08-3.06 7.44-7 7.93V18h4v2H8v-2h4v-2.07z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
              </svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`${styles.controlButton} ${!isVideoEnabled ? styles.disabled : ''}`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
              </svg>
            )}
          </button>

          {/* Cycle background (light gray / dark / white) */}
          <button
            onClick={cycleBackground}
            className={styles.controlButton}
            title="Change background"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.02-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </button>

          {/* Layout Toggle Button */}
          <button
            onClick={toggleLayout}
            className={styles.controlButton}
            title="Change Layout"
          >
            {layoutMode === 'spotlight' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14H5V7h6v10zm8 0h-6V7h6v10z"/>
              </svg>
            )}
            {layoutMode === 'side-equal' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 5v14h18V5H3zm16 12H5V7h14v10z"/>
              </svg>
            )}
            {layoutMode === 'side-70-30' && (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H5V7h12v10z"/>
              </svg>
            )}
          </button>

          {/* Swap Button (only visible in 70/30 mode) */}
          {layoutMode === 'side-70-30' && (
            <button
              onClick={handleSwapVideos}
              className={styles.controlButton}
              title="Swap Videos"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
              </svg>
            </button>
          )}

          {/* Transcript Button */}
          {isSpeechSupported && callState === 'connected' && (
            <button
              onClick={handleTranscriptToggle}
              className={`${styles.controlButton} ${isRecording ? styles.recording : ''} ${(quotaAvailable === 0 || isRecording) ? styles.disabled : ''}`}
              title={
                quotaAvailable === 0
                  ? 'Daily limit reached'
                  : isRecording
                    ? 'Transcript will be saved at end of call'
                    : 'Save transcript'
              }
              disabled={quotaAvailable === 0 || isRecording}
            >
              {isRecording ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" fill="red" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              )}
            </button>
          )}

          <button
            onClick={handleLeaveClick}
            className={`${styles.controlButton} ${styles.endCall}`}
            title="Leave call"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Recording Badges */}
      {isRecording && (
        <div className={styles.recordingBadge}>
          <span className={styles.recordingDot}></span>
          Recording
        </div>
      )}
      {partnerRecording && (
        <div className={styles.partnerRecordingBadge}>
          {callInfo?.partnerName || 'Partner'} is recording
        </div>
      )}

      {/* Error Display */}
      {peerError && (
        <div className={styles.errorBanner}>
          Connection error: {(peerError as Error).message}
        </div>
      )}


      {/* End Call Confirmation */}
      {showEndConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h3>Leave Call?</h3>
            <p>Are you sure you want to end this conversation?</p>
            <div className={styles.confirmButtons}>
              <button onClick={() => setShowEndConfirm(false)}>Cancel</button>
              <button onClick={confirmLeave} className={styles.confirmLeave}>
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waiting for Partner Reconnection */}
      {renderReconnectionOverlay()}
    </div>
  );
}
