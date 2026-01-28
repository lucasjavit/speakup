import type { User, ProficiencyLevel } from '@/types';
import styles from './UserLevel.module.css';

interface UserLevelProps {
  user: User;
  variant?: 'profile' | 'card';
}

const getLevelIcon = (level: ProficiencyLevel) => {
  const icons: Record<ProficiencyLevel, JSX.Element> = {
    BASIC: (
      <svg viewBox="0 0 24 24" fill="#22c55e" style={{ width: '1.25em', height: '1.25em', marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
      </svg>
    ),
    ELEMENTARY: (
      <svg viewBox="0 0 24 24" fill="#0ea5e9" style={{ width: '1.25em', height: '1.25em', marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
      </svg>
    ),
    LEVEL_UP: (
      <svg viewBox="0 0 24 24" fill="#f97316" style={{ width: '1.25em', height: '1.25em', marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
      </svg>
    ),
    EXPERT: (
      <svg viewBox="0 0 24 24" fill="#eab308" style={{ width: '1.25em', height: '1.25em', marginRight: '0.5rem', display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    ),
  };
  return icons[level];
};

const getLevelLabel = (level: ProficiencyLevel): string => {
  const labels: Record<ProficiencyLevel, string> = {
    BASIC: 'Basic',
    ELEMENTARY: 'Elementary',
    LEVEL_UP: 'Level Up',
    EXPERT: 'Expert',
  };
  return labels[level];
};

export function UserLevel({ user, variant = 'card' }: UserLevelProps) {
  const isProfile = variant === 'profile';

  return (
    <div className={`${styles.userLevel} ${styles[variant]}`}>
      {/* Nível Declarado */}
      <div className={styles.declaredLevel}>
        <span className={styles.label}>Declared Level:</span>
        <span className={styles.value}>
          {user.proficiencyLevel ? (
            <>
              {getLevelIcon(user.proficiencyLevel)}
              {getLevelLabel(user.proficiencyLevel)}
            </>
          ) : 'Not set'}
        </span>
      </div>

      {/* Nível Avaliado */}
      {user.evaluatedLevel && (
        <div className={styles.evaluatedLevel}>
          <span className={styles.label}>Evaluated Level:</span>
          <span className={styles.value}>
            {getLevelIcon(user.evaluatedLevel)}
            {getLevelLabel(user.evaluatedLevel)}
          </span>
          <span className={styles.evaluationsCount}>
            ({user.totalEvaluations} {user.totalEvaluations === 1 ? 'evaluation' : 'evaluations'})
          </span>
        </div>
      )}

      {/* Mensagem se não tem avaliações */}
      {!user.evaluatedLevel && isProfile && (
        <div className={styles.noEvaluations}>
          <p>Complete calls to receive evaluations from conversation partners.</p>
        </div>
      )}
    </div>
  );
}
