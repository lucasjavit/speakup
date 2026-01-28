import { useEffect, useState, useRef } from 'react';

export interface ConnectionStats {
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  bandwidth: number; // kbps
}

export type QualityLevel = 'excellent' | 'good' | 'poor' | 'bad' | 'unknown';

interface ConnectionQuality {
  level: QualityLevel;
  stats: ConnectionStats | null;
}

export function useConnectionStats(peerConnection: RTCPeerConnection | null): ConnectionQuality {
  const [quality, setQuality] = useState<ConnectionQuality>({
    level: 'unknown',
    stats: null,
  });

  const statsHistoryRef = useRef<ConnectionStats[]>([]);
  const lastBytesReceivedRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!peerConnection) return;

    const interval = setInterval(async () => {
      try {
        const stats = await peerConnection.getStats();
        let latency = 0;
        let packetLoss = 0;
        let jitter = 0;
        let bandwidth = 0;

        stats.forEach((report) => {
          // Ice candidate pair stats (for latency)
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            latency = report.currentRoundTripTime * 1000; // convert to ms
          }

          // Inbound RTP stream (for packet loss, jitter, bandwidth)
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            const packetsReceived = report.packetsReceived || 0;
            const packetsLost = report.packetsLost || 0;
            packetLoss = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
            jitter = (report.jitter || 0) * 1000; // convert to ms

            // Calculate bandwidth
            const bytesReceived = report.bytesReceived || 0;
            const timestamp = report.timestamp || 0;

            if (lastBytesReceivedRef.current > 0 && lastTimestampRef.current > 0) {
              const bytesDelta = bytesReceived - lastBytesReceivedRef.current;
              const timeDelta = (timestamp - lastTimestampRef.current) / 1000; // to seconds
              bandwidth = timeDelta > 0 ? (bytesDelta * 8) / timeDelta / 1000 : 0; // kbps
            }

            lastBytesReceivedRef.current = bytesReceived;
            lastTimestampRef.current = timestamp;
          }
        });

        const currentStats: ConnectionStats = { latency, packetLoss, jitter, bandwidth };

        // Add to history (keep last 5)
        statsHistoryRef.current.push(currentStats);
        if (statsHistoryRef.current.length > 5) {
          statsHistoryRef.current.shift();
        }

        // Calculate average (smooth out)
        const avgStats = calculateAverage(statsHistoryRef.current);
        const level = determineQuality(avgStats);

        setQuality({ level, stats: avgStats });
      } catch (error) {
        console.error('Error getting connection stats:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [peerConnection]);

  return quality;
}

function calculateAverage(history: ConnectionStats[]): ConnectionStats {
  if (history.length === 0) {
    return { latency: 0, packetLoss: 0, jitter: 0, bandwidth: 0 };
  }

  const sum = history.reduce(
    (acc, curr) => ({
      latency: acc.latency + curr.latency,
      packetLoss: acc.packetLoss + curr.packetLoss,
      jitter: acc.jitter + curr.jitter,
      bandwidth: acc.bandwidth + curr.bandwidth,
    }),
    { latency: 0, packetLoss: 0, jitter: 0, bandwidth: 0 }
  );

  return {
    latency: sum.latency / history.length,
    packetLoss: sum.packetLoss / history.length,
    jitter: sum.jitter / history.length,
    bandwidth: sum.bandwidth / history.length,
  };
}

function determineQuality(stats: ConnectionStats): QualityLevel {
  let badCount = 0;
  let mediumCount = 0;

  // Latency thresholds
  if (stats.latency > 300) badCount++;
  else if (stats.latency > 150) mediumCount++;

  // Packet loss thresholds
  if (stats.packetLoss > 3) badCount++;
  else if (stats.packetLoss > 1) mediumCount++;

  // Jitter thresholds
  if (stats.jitter > 50) badCount++;
  else if (stats.jitter > 30) mediumCount++;

  // Determine overall quality
  if (badCount >= 2) return 'bad';
  if (badCount >= 1 || mediumCount >= 2) return 'poor';
  if (mediumCount >= 1) return 'good';
  return 'excellent';
}
