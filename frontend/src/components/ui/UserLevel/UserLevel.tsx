import type { User, ProficiencyLevel } from '@/types';
import styles from './UserLevel.module.css';

interface UserLevelProps {
  user: User;
  variant?: 'profile' | 'card';
}

const getLevelLabel = (level: ProficiencyLevel): string => {
  const labels: Record<ProficiencyLevel, string> = {
    BEGINNER: 'A1 - Beginner',
    ELEMENTARY: 'A2 - Elementary',
    INTERMEDIATE: 'B1 - Intermediate',
    UPPER_INTERMEDIATE: 'B2 - Upper Intermediate',
    ADVANCED: 'C1 - Advanced',
    FLUENT: 'C2 - Fluent',
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
          {user.proficiencyLevel ? getLevelLabel(user.proficiencyLevel) : 'Not set'}
        </span>
      </div>

      {/* Nível Avaliado */}
      {user.evaluatedLevel && (
        <div className={styles.evaluatedLevel}>
          <span className={styles.label}>Evaluated Level:</span>
          <span className={styles.value}>
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
