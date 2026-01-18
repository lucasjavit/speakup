import { useAuthStore } from '@/stores/authStore';
import { Button, Card } from '@/components/ui';
import styles from './Home.module.css';

export function Home() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>SpeakUp</h1>
        <p className={styles.subtitle}>
          Practice languages with real people through video conversations
        </p>
        {!isAuthenticated && (
          <div className={styles.actions}>
            <Button size="lg" onClick={() => (window.location.href = '/login')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        )}
      </section>

      {isAuthenticated && user && (
        <section className={styles.dashboard}>
          <Card header={<h2>Welcome back, {user.name}!</h2>}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>Total Calls</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>0h</span>
                <span className={styles.statLabel}>Total Time</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>0</span>
                <span className={styles.statLabel}>This Week</span>
              </div>
            </div>
            {!user.profileCompleted && (
              <div className={styles.alert}>
                <p>Complete your profile to start practicing!</p>
                <Button
                  size="sm"
                  onClick={() => (window.location.href = '/profile/complete')}
                >
                  Complete Profile
                </Button>
              </div>
            )}
          </Card>

          <Card header={<h2>Next Session</h2>}>
            <p className={styles.noSession}>No sessions scheduled</p>
            <Button fullWidth disabled={!user.profileCompleted}>
              Join Session
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}
