import { useConnectionStats, type QualityLevel } from '@/hooks/useConnectionStats';
import styles from './NetworkQualityIndicator.module.css';

interface NetworkQualityIndicatorProps {
  peerConnection: RTCPeerConnection | null;
}

const QUALITY_CONFIG: Record<QualityLevel, { color: string; bars: number; label: string }> = {
  excellent: { color: '#10b981', bars: 4, label: 'Excellent' },
  good: { color: '#eab308', bars: 3, label: 'Good' },
  poor: { color: '#f97316', bars: 2, label: 'Poor' },
  bad: { color: '#dc2626', bars: 1, label: 'Bad' },
  unknown: { color: '#94a3b8', bars: 0, label: 'Connecting...' },
};

export function NetworkQualityIndicator({ peerConnection }: NetworkQualityIndicatorProps) {
  const { level, stats } = useConnectionStats(peerConnection);
  const config = QUALITY_CONFIG[level];

  return (
    <div className={styles.indicator}>
      {/* Signal Bars */}
      <div className={styles.bars}>
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`${styles.bar} ${bar <= config.bars ? styles.active : ''}`}
            style={{ backgroundColor: bar <= config.bars ? config.color : '#cbd5e1' }}
          />
        ))}
      </div>

      {/* Latency */}
      {stats && (
        <span className={styles.latency} style={{ color: config.color }}>
          {Math.round(stats.latency)}ms
        </span>
      )}

      {/* Tooltip */}
      {stats && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{config.label}</div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Latency:</span>
            <span className={styles.tooltipValue}>{Math.round(stats.latency)}ms</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Packet Loss:</span>
            <span className={styles.tooltipValue}>{stats.packetLoss.toFixed(2)}%</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Jitter:</span>
            <span className={styles.tooltipValue}>{Math.round(stats.jitter)}ms</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Bandwidth:</span>
            <span className={styles.tooltipValue}>{stats.bandwidth.toFixed(1)} kbps</span>
          </div>
        </div>
      )}
    </div>
  );
}
