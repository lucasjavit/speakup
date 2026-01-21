import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import styles from './Error.module.css';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  'https-required': {
    title: 'HTTPS Required',
    description: 'Video calls require a secure connection (HTTPS). Please access this site using HTTPS to enable camera and microphone access.',
  },
  'media-denied': {
    title: 'Media Access Denied',
    description: 'Camera and microphone access was denied. Please allow access in your browser settings to make video calls.',
  },
  'no-devices': {
    title: 'No Media Devices Found',
    description: 'No camera or microphone was found on your device. Please connect a camera and microphone to make video calls.',
  },
  'connection-failed': {
    title: 'Connection Failed',
    description: 'Failed to establish a connection. Please check your internet connection and try again.',
  },
  default: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again later.',
  },
};

export function Error() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('code') || 'default';
  const customMessage = searchParams.get('message');

  const error = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <h1 className={styles.title}>{error.title}</h1>
      <p className={styles.description}>
        {customMessage || error.description}
      </p>
      {errorCode === 'https-required' && (
        <div className={styles.hint}>
          <p>Current URL: <code>{window.location.href}</code></p>
          <p>Try accessing: <code>{window.location.href.replace('http://', 'https://')}</code></p>
        </div>
      )}
      <div className={styles.actions}>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
