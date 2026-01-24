import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services';
import styles from './Login.module.css';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setError('');

      if (!credentialResponse.credential) {
        throw new Error('No credential received');
      }

      // Send ID token to backend for validation
      const data = await authService.loginWithGoogle(credentialResponse.credential);
      login(data.user, data.accessToken, data.refreshToken);

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
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>SpeakYou</h1>
          <p className={styles.subtitle}>Sign in to start practicing</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.buttons}>
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
          By signing in, you agree to our{' '}
          <a href="/terms">Terms of Service</a> and{' '}
          <a href="/privacy">Privacy Policy</a>
        </p>
      </Card>
    </div>
  );
}
