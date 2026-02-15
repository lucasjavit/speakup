import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transcriptService, type TranscriptSummaryDTO } from '@/services/transcriptService';
import { userService } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import styles from './Conversations.module.css';

const PENDING_OPTIMISTIC_MS = 90_000; // treat as "in progress" for 90s after click so refresh doesn't flash "Transcript only"

export function Conversations() {
  const navigate = useNavigate();
  const [transcripts, setTranscripts] = useState<TranscriptSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { user, setUser } = useAuthStore();
  const [hasApiKey, setHasApiKey] = useState(!!user?.openaiApiKey);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const pendingRequestedAtRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    userService.getCurrentUser().then((updatedUser) => {
      setUser(updatedUser);
      setHasApiKey(!!updatedUser.openaiApiKey);
    }).catch(() => {
      // Failed to refresh user data - use cached value
    });
  }, [setUser]);

  const loadTranscripts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await transcriptService.getUserTranscripts(page);
      const now = Date.now();
      const list = response.content.map((t) => {
        const requestedAt = pendingRequestedAtRef.current.get(t.id);
        if (requestedAt != null && now - requestedAt < PENDING_OPTIMISTIC_MS) {
          if (t.analysisStatus === 'NOT_REQUESTED' || t.analysisStatus === 'PENDING') {
            return { ...t, analysisStatus: 'PENDING' as const, hasAnalysis: true };
          }
        }
        return t;
      });
      setTranscripts(list);
      setTotalPages(response.totalPages);
    } catch (error) {
      if (!silent) console.error('Failed to load transcripts:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadTranscripts();
  }, [loadTranscripts]);

  /**
   * Background processing: when user clicks "AI Analysis", the backend runs analysis
   * asynchronously (@Async). We update the UI immediately (PENDING) and poll the list
   * until status becomes COMPLETED/FAILED.
   * Other options: WebSocket push, Server-Sent Events, or single-transcript polling.
   */
  const hasPending = transcripts.some(t => t.analysisStatus === 'PENDING');
  useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => {
      loadTranscripts(true); // silent refresh, no loading spinner
    }, 4000);
    return () => clearInterval(interval);
  }, [hasPending, loadTranscripts]);


  const handleTranscriptClick = (id: string) => {
    navigate(`/conversations/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string | undefined) => {
    const s = (status ?? '').toUpperCase();
    if (s === 'COMPLETED') return <span className={styles.badgeAnalysis}>With AI analysis</span>;
    if (s === 'PENDING') return <span className={styles.badgePending}>Analysis in progress…</span>;
    if (s === 'FAILED') return <span className={styles.badgeFailed}>Analysis failed</span>;
    // NOT_REQUESTED, empty, or any other value → no analysis yet
    return <span className={styles.badgeTranscript}>Transcript only</span>;
  };

  /** Show "AI Analysis" only when there is no completed analysis (hide when COMPLETED). */
  const canRequestAnalysis = (t: TranscriptSummaryDTO) => {
    const s = (t.analysisStatus ?? '').toUpperCase();
    if (s === 'COMPLETED') return false;
    return s === 'NOT_REQUESTED' || s === 'FAILED' || (!t.hasAnalysis && s !== 'PENDING');
  };

  const handleAnalyze = async (e: React.MouseEvent, transcriptId: string) => {
    e.stopPropagation(); // Prevent navigating to transcript detail
    if (!hasApiKey) {
      toast.error('Configure your OpenAI API key in Settings first');
      return;
    }
    pendingRequestedAtRef.current.set(transcriptId, Date.now());
    // Optimistic update: show PENDING immediately (processing runs in background on server)
    setTranscripts(prev =>
      prev.map(t =>
        t.id === transcriptId
          ? { ...t, analysisStatus: 'PENDING' as const, hasAnalysis: true }
          : t
      )
    );
    setAnalyzingIds(prev => new Set(prev).add(transcriptId));
    toast.success('Analysis started in background. The page will update when it’s ready.');
    try {
      await transcriptService.requestAnalysis(transcriptId);
      // Status already PENDING; polling will update to COMPLETED/FAILED
    } catch (error: any) {
      pendingRequestedAtRef.current.delete(transcriptId);
      const message = error?.message || 'Failed to start analysis';
      toast.error(message);
      const is409 = error?.response?.status === 409;
      if (is409) {
        loadTranscripts(true);
      } else {
        setTranscripts(prev =>
          prev.map(t =>
            t.id === transcriptId
              ? { ...t, analysisStatus: 'NOT_REQUESTED' as const, hasAnalysis: false }
              : t
          )
        );
      }
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(transcriptId);
        return next;
      });
    }
  };

  if (loading && transcripts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your conversations...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={() => navigate('/')} className={styles.backButton}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>My Conversations</h1>
        <p className={styles.subtitle}>
          Review your conversation transcripts and AI analysis
        </p>
      </div>

      {/* API Key Warning Banner */}
      {!hasApiKey && (
        <div className={styles.apiKeyBanner}>
          <div className={styles.bannerContent}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.bannerIcon}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <div className={styles.bannerText}>
              <h3>Configure your OpenAI API Key</h3>
              <p>To enable AI analysis of your conversations, you need to configure your OpenAI API key in Settings.</p>
            </div>
            <button 
              onClick={() => navigate('/settings')}
              className={styles.bannerButton}
            >
              Go to Settings
            </button>
          </div>
        </div>
      )}

      {transcripts.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.emptyIcon}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <h2>No conversations yet</h2>
          <p>Start recording your conversations to see them here</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className={styles.card}
                onClick={() => handleTranscriptClick(transcript.id)}
              >
                <div className={styles.cardHeader}>
                  {transcript.partnerAvatarUrl ? (
                    <img
                      src={transcript.partnerAvatarUrl}
                      alt={transcript.partnerName}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {transcript.partnerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>
                      Conversation with {transcript.partnerName}
                    </h3>
                    <p className={styles.cardDate}>
                      {formatDate(transcript.conversationDate)}
                    </p>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  {getStatusBadge(transcript.analysisStatus)}
                  <div className={styles.cardActions}>
                    {canRequestAnalysis(transcript) && (
                      <button
                        onClick={(e) => handleAnalyze(e, transcript.id)}
                        className={(transcript.analysisStatus ?? '').toUpperCase() === 'FAILED' ? styles.retryButton : styles.analyzeButton}
                        disabled={analyzingIds.has(transcript.id) || !hasApiKey}
                        title={!hasApiKey ? 'Configure API key in Settings' : (transcript.analysisStatus ?? '').toUpperCase() === 'FAILED' ? 'Retry AI analysis' : 'Run AI analysis'}
                      >
                        {analyzingIds.has(transcript.id) ? (
                          <span className={styles.spinner} />
                        ) : (transcript.analysisStatus ?? '').toUpperCase() === 'FAILED' ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                          </svg>
                        )}
                        {(transcript.analysisStatus ?? '').toUpperCase() === 'FAILED' ? 'Retry' : 'AI Analysis'}
                      </button>
                    )}
                    <svg viewBox="0 0 24 24" fill="currentColor" className={styles.chevron}>
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className={styles.pageButton}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className={styles.pageButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
