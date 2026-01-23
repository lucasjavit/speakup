import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import '@/styles/globals.css';
import { App } from './App';
import './debug-env';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
console.log('Google Client ID being used:', googleClientId);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
