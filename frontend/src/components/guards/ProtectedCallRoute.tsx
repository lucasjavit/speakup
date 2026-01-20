import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { creditService } from '@/services';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedCallRouteProps {
  children: React.ReactNode;
}

export function ProtectedCallRoute({ children }: ProtectedCallRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCredits, setHasCredits] = useState(false);

  useEffect(() => {
    async function checkCredits() {
      if (!isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        const canJoin = await creditService.canJoinSession();
        setHasCredits(canJoin);
      } catch (err) {
        console.error('Error checking credits:', err);
        setHasCredits(false);
      } finally {
        setIsChecking(false);
      }
    }

    checkCredits();
  }, [isAuthenticated]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        color: '#fff',
      }}>
        Checking credits...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to credits page if no credits
  if (!hasCredits) {
    return <Navigate to="/credits/buy" replace />;
  }

  // User has credits, allow access
  return <>{children}</>;
}
