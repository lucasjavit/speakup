import { useNavigate } from 'react-router-dom';
import styles from './BackButton.module.css';

export interface BackButtonProps {
  /** Custom path to navigate to. If not provided, uses browser history */
  to?: string;
  /** Custom label. Defaults to "Back" */
  label?: string;
  /** Additional CSS class */
  className?: string;
}

export function BackButton({ to, label = 'Back', className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${styles.backButton} ${className || ''}`}
      aria-label={label}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span className={styles.label}>{label}</span>
    </button>
  );
}
