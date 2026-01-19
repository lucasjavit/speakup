import { useEffect, useState, useCallback, useRef } from 'react';

interface UseCallTimerReturn {
  timeRemaining: number;  // seconds
  timeElapsed: number;    // seconds
  isRunning: boolean;
  formattedTimeRemaining: string;
  formattedTimeElapsed: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

interface UseCallTimerOptions {
  duration?: number;  // in seconds, default 10 minutes (600s)
  onTimeUp?: () => void;
  onWarning?: (secondsRemaining: number) => void;
  warningAt?: number;  // seconds before end to trigger warning
}

export function useCallTimer(options: UseCallTimerOptions = {}): UseCallTimerReturn {
  const {
    duration = 600, // 10 minutes default
    onTimeUp,
    onWarning,
    warningAt = 60, // 1 minute warning
  } = options;

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacksRef = useRef({ onTimeUp, onWarning });
  callbacksRef.current = { onTimeUp, onWarning };

  const timeRemaining = Math.max(0, duration - timeElapsed);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup interval
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start timer
  const start = useCallback(() => {
    clearTimer();
    setTimeElapsed(0);
    setHasWarned(false);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  }, [clearTimer]);

  // Pause timer
  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  // Resume timer
  const resume = useCallback(() => {
    if (!isRunning && timeElapsed < duration) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
  }, [isRunning, timeElapsed, duration]);

  // Reset timer
  const reset = useCallback(() => {
    clearTimer();
    setTimeElapsed(0);
    setHasWarned(false);
    setIsRunning(false);
  }, [clearTimer]);

  // Handle time up and warnings
  useEffect(() => {
    if (!isRunning) return;

    // Check for warning
    if (!hasWarned && timeRemaining <= warningAt && timeRemaining > 0) {
      setHasWarned(true);
      callbacksRef.current.onWarning?.(timeRemaining);
    }

    // Check for time up
    if (timeRemaining <= 0) {
      clearTimer();
      setIsRunning(false);
      callbacksRef.current.onTimeUp?.();
    }
  }, [timeRemaining, isRunning, hasWarned, warningAt, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    timeRemaining,
    timeElapsed,
    isRunning,
    formattedTimeRemaining: formatTime(timeRemaining),
    formattedTimeElapsed: formatTime(timeElapsed),
    start,
    pause,
    resume,
    reset,
  };
}
