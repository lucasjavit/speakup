import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const hideTooltip = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + 8;
          break;
      }

      // Adjust if tooltip goes off-screen horizontally
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8;
      }

      // Adjust if tooltip goes off-screen vertically
      if (top < 8) {
        top = triggerRect.bottom + 8; // Show below if no space above
      } else if (top + tooltipRect.height > viewportHeight - 8) {
        top = triggerRect.top - tooltipRect.height - 8; // Show above if no space below
      }

      setCoords({ top, left });
    }
  }, [isVisible, position]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const tooltip = isVisible && (
    <div
      ref={tooltipRef}
      className={`${styles.tooltip} ${styles[position]}`}
      style={{ top: coords.top, left: coords.left }}
    >
      <span className={styles.content}>{content}</span>
      <span className={`${styles.arrow} ${styles[`arrow${position.charAt(0).toUpperCase() + position.slice(1)}`]}`} />
    </div>
  );

  return (
    <div
      ref={triggerRef}
      className={styles.wrapper}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={showTooltip}
      onTouchEnd={hideTooltip}
      onClick={(e) => {
        // On mobile, first tap shows tooltip, second tap triggers action
        if (window.innerWidth <= 768 && !isVisible) {
          e.preventDefault();
          showTooltip();
        }
      }}
    >
      {children}
      {createPortal(tooltip, document.body)}
    </div>
  );
}
