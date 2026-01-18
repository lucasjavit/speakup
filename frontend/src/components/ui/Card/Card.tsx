import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/utils';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  header,
  footer,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  return (
    <div className={cn(styles.card, className)} {...props}>
      {header && <div className={styles.header}>{header}</div>}
      <div className={cn(styles.body, styles[`padding-${padding}`])}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}
