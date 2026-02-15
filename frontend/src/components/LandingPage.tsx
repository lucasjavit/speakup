import { useEffect, useState } from 'react';
import type { Session } from '@/types/user';
import { topicService } from '@/services';
import styles from './LandingPage.module.css';

interface LandingPageProps {
  isLoading: boolean;
  activeSession: Session | null;
  onJoinSession: (sessionId: string) => void;
  onSignIn: () => void;
  formatTime: (time: string) => string;
}

export function LandingPage({
  isLoading,
  activeSession,
  onJoinSession,
  onSignIn,
  formatTime
}: LandingPageProps) {
  const [displayTopic, setDisplayTopic] = useState<string>("Join a conversation and practice your language skills!");
  const [waitingPartner, setWaitingPartner] = useState<string>("Sarah");

  // Common American names for random selection
  const commonNames = [
    "Sarah", "Michael", "Emily", "James", "Jessica",
    "David", "Jennifer", "Robert", "Lisa", "John",
    "Amanda", "Daniel", "Michelle", "Chris", "Ashley"
  ];

  // Fetch random topic from backend and select random name whenever session changes
  useEffect(() => {
    if (activeSession) {
      topicService.getRandomTopic()
        .then(topic => setDisplayTopic(topic))
        .catch(error => {
          console.error('Failed to fetch topic:', error);
          // Keep the default fallback topic
        });

      // Select random name
      const randomName = commonNames[Math.floor(Math.random() * commonNames.length)];
      setWaitingPartner(randomName);
    }
  }, [activeSession?.id]);
  return (
    <div className={styles.landing}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroGrid}>
          {/* Left Side - Session Info Card */}
          {activeSession ? (
            <div className={styles.sessionInfoCard}>
              <h2 className={styles.topicName}>
                <span className={styles.topicLabel}>Next Topic: </span>
                {displayTopic}
              </h2>
              <div className={styles.sessionDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Session Time</span>
                  <span className={styles.detailValue}>
                    {formatTime(activeSession.startTime)} - {formatTime(activeSession.endTime)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Duration</span>
                  <span className={styles.detailValue}>10 minutes</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.sessionInfoCard}>
              <h2 className={styles.noSessionTitle}>No session running</h2>
              <p className={styles.noSessionText}>
                Check back during scheduled session times to practice with other language learners.
              </p>
              <div className={styles.scheduleHint}>
                <span className={styles.scheduleLabel}>Typical Schedule:</span>
                <span className={styles.scheduleValue}>7:00 AM - 8:00 PM (daily)</span>
              </div>
            </div>
          )}

          {/* Right Side - Join Card */}
          <div className={styles.joinCard}>

            {isLoading ? (
              <>
                <h3 className={styles.joinTitle}>Join next session!</h3>
                <p className={styles.joinText}>Loading...</p>
              </>
            ) : activeSession ? (
              <>
                <div className={styles.joinTitleWithBadge}>
                  <h3 className={styles.joinTitle}>Join next session!</h3>
                  <div className={styles.liveBadgeCard}>
                    <span className={styles.liveDot}></span>
                    Now Running
                  </div>
                </div>

                <div className={styles.joinIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>

                <p className={styles.waitingText}>
                  <strong>{waitingPartner}</strong> is in the queue waiting to talk to you!
                </p>

                <button
                  className={styles.joinButton}
                  onClick={() => onJoinSession(activeSession.id)}
                >
                  Join Now
                </button>
              </>
            ) : (
              <>
                <h3 className={styles.joinTitle}>Join next session!</h3>
                <p className={styles.joinText}>
                  Check back during scheduled session times
                </p>
                <button className={styles.joinButton} onClick={onSignIn}>
                  Sign in
                </button>
              </>
            )}

            <p className={styles.joinFooter}>
              Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onSignIn(); }} className={styles.joinLink}>
                Sign in
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* What is SpeakYou */}
      <section className={styles.about}>
        <h2 className={styles.aboutTitle}>What is SpeakYou?</h2>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div className={styles.statValue}>1:1</div>
            <p className={styles.statLabel}>conversation</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <div className={styles.statValue}>
              10<span className={styles.statUnit}>min</span>
            </div>
            <p className={styles.statLabel}>per session</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <div className={styles.statValue}>Real</div>
            <p className={styles.statLabel}>conversations</p>
          </div>
        </div>

        <p className={styles.aboutText}>
          SpeakYou is a <strong>video conversation platform</strong> that connects
          language learners worldwide. Practice speaking through <strong>1-on-1 video calls</strong> with
          native speakers from different countries. Each 10-minute session features engaging
          topics, giving you plenty of time to speak, listen, and improve your fluency
          naturally—no textbooks, no pressure, just real conversations.
        </p>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Powerful Features to Accelerate Your Learning</h2>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>AI-Powered Analysis</h3>
            <p className={styles.featureDescription}>
              Get detailed AI feedback after each conversation. Receive insights on grammar, pronunciation, 
              vocabulary usage, and fluency to track your progress and identify areas for improvement.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Download Transcripts</h3>
            <p className={styles.featureDescription}>
              Export your conversation transcripts in multiple formats (TXT, SRT, PDF). Keep a record 
              of your practice sessions and review them anytime to reinforce your learning.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Peer Level Assessment</h3>
            <p className={styles.featureDescription}>
              Your conversation partners evaluate your language level after each session. Build a 
              comprehensive profile based on real feedback from fellow language learners.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Personalized Profile</h3>
            <p className={styles.featureDescription}>
              Create a detailed profile with your native language, target language, timezone preferences, 
              and proficiency level. Get matched with the perfect conversation partners for you.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Global Community</h3>
            <p className={styles.featureDescription}>
              Connect with language learners from around the world. Share experiences, learn about 
              different cultures, and make international friends while improving your skills.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
