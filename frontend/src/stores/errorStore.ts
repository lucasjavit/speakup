import { create } from 'zustand';

export interface ErrorInfo {
  id: string;
  title?: string;
  message: string;
  details?: string;
  severity?: 'error' | 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

interface ErrorStoreState {
  currentError: ErrorInfo | null;
  errorQueue: ErrorInfo[];

  // Actions
  showError: (error: Omit<ErrorInfo, 'id'>) => void;
  hideError: () => void;
  clearAllErrors: () => void;
}

let errorIdCounter = 0;

export const useErrorStore = create<ErrorStoreState>((set, get) => ({
  currentError: null,
  errorQueue: [],

  showError: (error) => {
    const newError: ErrorInfo = {
      ...error,
      id: `error-${++errorIdCounter}`,
    };

    const { currentError, errorQueue } = get();

    if (currentError) {
      // Queue the error if one is already showing
      set({ errorQueue: [...errorQueue, newError] });
    } else {
      // Show immediately if no error is showing
      set({ currentError: newError });
    }
  },

  hideError: () => {
    const { errorQueue } = get();

    if (errorQueue.length > 0) {
      // Show next error in queue
      const [next, ...rest] = errorQueue;
      set({ currentError: next, errorQueue: rest });
    } else {
      // Clear current error
      set({ currentError: null });
    }
  },

  clearAllErrors: () => {
    set({ currentError: null, errorQueue: [] });
  },
}));

// Helper function to show errors from anywhere
export const showError = (error: Omit<ErrorInfo, 'id'>) => {
  useErrorStore.getState().showError(error);
};

// Predefined error helpers
export const showHttpsRequiredError = () => {
  showError({
    title: 'HTTPS Required',
    message: 'Video calls require a secure connection (HTTPS). Please access this site using HTTPS to enable camera and microphone access.',
    details: `Current: ${window.location.href}\nRequired: ${window.location.href.replace('http://', 'https://')}`,
    severity: 'error',
    actionLabel: 'Switch to HTTPS',
    onAction: () => {
      window.location.href = window.location.href.replace('http://', 'https://');
    },
  });
};

export const showMediaAccessDeniedError = () => {
  showError({
    title: 'Media Access Denied',
    message: 'Camera and microphone access was denied. Please allow access in your browser settings to make video calls.',
    severity: 'warning',
  });
};

export const showConnectionError = (details?: string) => {
  showError({
    title: 'Connection Failed',
    message: 'Failed to establish a connection. Please check your internet connection and try again.',
    details,
    severity: 'error',
  });
};

export const showGenericError = (message: string, details?: string) => {
  showError({
    title: 'Error',
    message,
    details,
    severity: 'error',
  });
};
