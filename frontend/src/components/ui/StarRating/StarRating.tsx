import { useState } from 'react';
import { cn } from '@/utils';
import styles from './StarRating.module.css';

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  readonly = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (starValue: number) => {
    if (disabled || readonly) return;
    onChange?.(starValue);
  };

  const handleMouseEnter = (starValue: number) => {
    if (disabled || readonly) return;
    setHoverValue(starValue);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div
      className={cn(
        styles.container,
        styles[size],
        disabled && styles.disabled,
        readonly && styles.readonly,
        className
      )}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayValue;

        return (
          <button
            key={starValue}
            type="button"
            className={cn(
              styles.star,
              isFilled && styles.filled
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            disabled={disabled || readonly}
            aria-label={`Rate ${starValue} of ${max} stars`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
