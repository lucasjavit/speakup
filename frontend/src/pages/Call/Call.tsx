import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallStore } from '@/stores/callStore';
import { useAuthStore } from '@/stores/authStore';
import { usePeerConnection, useCallTimer, useMediaRecorder, useWebSocket } from '@/hooks';
import { conversationService, peerService } from '@/services';
import { DeviceSelector } from '@/components/video/DeviceSelector';
import styles from './Call.module.css';

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

  const reconnectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleCallEndRef = useRef<((reason: 'timer' | 'user_left' | 'partner_left' | 'peer_closed' | 'error') => void) | null>(null);

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
    console.log('Partner disconnected, starting reconnection timer');
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
  }, [callInfo?.partnerName, setWaitingReconnection, handleReconnectionTimeout]);

  // WebSocket for notifications
  const { notifyCallEnded } = useWebSocket({
    onPartnerDisconnected: handlePartnerDisconnected,
    onPartnerReconnected: handlePartnerReconnected,
    onReconnectionTimeout: handleReconnectionTimeout,
  });

  // Cleanup reconnection timer on unmount
  useEffect(() => {
    return () => {
      if (reconnectionTimerRef.current) {
        clearInterval(reconnectionTimerRef.current);
      }
    };
  }, []);

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

  // Track if we've started setup to avoid duplicate initialization
  const setupStartedRef = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle device selection
  const handleDevicesSelected = (audioDeviceId: string | null, videoDeviceId: string | null) => {
    console.log('Devices selected - audio:', audioDeviceId, 'video:', videoDeviceId);
    peerService.setSelectedDevices(audioDeviceId, videoDeviceId);
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
          // Convert partner's UUID to the same format used by PeerJS
          const partnerPeerId = `sp_${info!.peerId.replace(/-/g, '').substring(0, 16)}`;
          // Small delay to ensure the other peer is ready
          console.log('Initiator: calling peer', partnerPeerId, '(original:', info!.peerId, ')');
          setTimeout(() => {
            call(partnerPeerId);
          }, 3000); // Increased delay to ensure both peers are ready
        } else {
          const myPeerId = `sp_${currentUser.id.replace(/-/g, '').substring(0, 16)}`;
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

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleCallEnd = async (reason: 'timer' | 'user_left' | 'partner_left' | 'peer_closed' | 'error') => {
    console.log('handleCallEnd called with reason:', reason);

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

    // Stop recording and upload
    if (recorder.isRecording && callInfo) {
      try {
        const blob = await recorder.stopRecording();
        if (blob && blob.size > 0) {
          await recorder.uploadRecording(callInfo.conversationId, blob);
        }
      } catch (error) {
        console.error('Failed to upload recording:', error);
      }
    }

    // Notify backend
    if (callInfo) {
      const completed = reason === 'timer' || reason === 'user_left';
      await conversationService.endConversation(callInfo.conversationId, completed);
      notifyCallEnded(callInfo.conversationId, reason === 'timer' ? 'TIMER' : reason === 'error' ? 'ERROR' : 'USER_LEFT');
    }

    setCallState('ended');
    endCall();

    // Navigate to break screen with call summary
    navigate('/break', {
      state: {
        partnerName: callInfo?.partnerName || 'Partner',
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

  return (
    <div className={styles.container}>
      {/* Topic Banner */}
      <div className={styles.topicBanner}>
        <span className={styles.topicLabel}>Topic:</span>
        <span className={styles.topicText}>{callInfo.topic}</span>
      </div>

      {/* Video Grid */}
      <div className={styles.videoGrid}>
        {/* Remote Video (Partner) */}
        <div className={styles.videoContainer}>
          <video
            ref={remoteVideoRef}
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
          <div className={styles.nameTag}>{callInfo.partnerName}</div>
        </div>

        {/* Local Video (Self) */}
        <div className={styles.localVideoWrapper}>
          <video
            ref={localVideoRef}
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
        </div>
      </div>

      {/* Timer */}
      <div className={styles.timer}>
        <span className={timer.timeRemaining <= 60 ? styles.timerWarning : ''}>
          {timer.formattedTimeRemaining}
        </span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
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
