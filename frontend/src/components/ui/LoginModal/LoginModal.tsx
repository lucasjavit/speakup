import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services';
import styles from './LoginModal.module.css';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError('');

      if (!credentialResponse.credential) {
        throw new Error('No credential received');
      }

      // Send ID token to backend for validation
      const data = await authService.loginWithGoogle(credentialResponse.credential);
      login(data.user, data.accessToken, data.refreshToken);

      // Close modal
      onClose();

      // Navigate based on profile completion
      if (data.user.profileCompleted) {
        navigate('/');
      } else {
        navigate('/complete-profile');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to sign in. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign in failed. Please try again.');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.content}>
          <div className={styles.logo}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              <circle cx="9" cy="10" r="1.5"/>
              <circle cx="12" cy="10" r="1.5"/>
              <circle cx="15" cy="10" r="1.5"/>
            </svg>
          </div>

          <h2 className={styles.title}>Welcome to SpeakYou</h2>
          <p className={styles.subtitle}>Sign in to join conversation sessions</p>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.googleButtonWrapper}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
            />
          </div>

          <p className={styles.terms}>
            By continuing, you agree to SpeakYou's Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
