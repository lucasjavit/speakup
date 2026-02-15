import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { transcriptService, type TranscriptWithAnalysisDTO, type TranscriptEntry } from '@/services/transcriptService';
import { Card } from '@/components/ui/Card/Card';
import toast from 'react-hot-toast';
import styles from './TranscriptDetails.module.css';

export function TranscriptDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState<TranscriptWithAnalysisDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeAnalysisInDownload, setIncludeAnalysisInDownload] = useState(true);
  const [activeTab, setActiveTab] = useState<'transcript' | 'analysis'>('transcript');

  useEffect(() => {
    if (id) {
      loadTranscript();
    }
  }, [id]);

  const loadTranscript = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await transcriptService.getTranscriptDetails(id);
      setTranscript(data);
      if (data.analysisStatus?.toUpperCase() === 'COMPLETED') {
        setActiveTab('analysis');
      }
    } catch (error) {
      console.error('Failed to load transcript:', error);
      toast.error('Failed to load transcript');
      navigate('/conversations');
    } finally {
      setLoading(false);
    }
  };

  /** Show AI Analysis tab when we have analysis data or when status is COMPLETED (so user always sees the option). */
  const showAnalysisTab = Boolean(
    transcript && (
      (transcript.includeAnalysis && transcript.analysis) ||
      (transcript.analysisStatus?.toUpperCase() === 'COMPLETED')
    )
  );

  const handleDownload = async (format: 'txt' | 'srt' | 'pdf') => {
    if (!transcript) return;
    
    try {
      if (format === 'txt') {
        transcriptService.downloadTxt(transcript, includeAnalysisInDownload);
      } else if (format === 'srt') {
        transcriptService.downloadSrt(transcript);
      } else if (format === 'pdf') {
        await transcriptService.downloadPdf(transcript, includeAnalysisInDownload);
      }
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download transcript');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderAnalysisSection = () => {
    if (!transcript) return null;
    // When status is COMPLETED but analysis not loaded yet, show loading and allow refetch
    if (!transcript.analysis) {
      if (transcript.analysisStatus?.toUpperCase() === 'COMPLETED') {
        return (
          <div className={styles.analysisContainer}>
            <p>Analysis completed. If it doesn’t appear, <button type="button" className={styles.retryLink} onClick={() => loadTranscript()}>reload the page</button>.</p>
          </div>
        );
      }
      return null;
    }

    try {
      const grammar = JSON.parse(transcript.analysis.grammarCorrections || '[]');
      const vocabulary = JSON.parse(transcript.analysis.vocabularySuggestions || '[]');
      const fluency = JSON.parse(transcript.analysis.fluencyAnalysis || '{}');
      const phrases = JSON.parse(transcript.analysis.naturalPhrases || '[]');
      const topics = JSON.parse(transcript.analysis.topicsPracticed || '[]');

      return (
        <div className={styles.analysisContainer}>
          <div className={styles.analysisHeader}>
            <h2>AI Analysis</h2>
            <div className={styles.levelBadge}>
              Level: {transcript.analysis.estimatedLevel}
            </div>
          </div>

          {/* Grammar Corrections */}
          {grammar.length > 0 && (
            <div className={styles.section}>
              <h3>Grammar Corrections</h3>
              <div className={styles.correctionsList}>
                {grammar.map((item: any, idx: number) => (
                  <div key={idx} className={styles.correctionItem}>
                    <div className={styles.original}>❌ {item.original}</div>
                    <div className={styles.corrected}>✅ {item.corrected}</div>
                    <div className={styles.explanation}>{item.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vocabulary Suggestions */}
          {vocabulary.length > 0 && (
            <div className={styles.section}>
              <h3>Vocabulary Suggestions</h3>
              <div className={styles.vocabularyList}>
                {vocabulary.map((item: any, idx: number) => (
                  <div key={idx} className={styles.vocabularyItem}>
                    <div className={styles.vocabularyWord}>
                      <span className={styles.wordLabel}>Used:</span> {item.word}
                    </div>
                    <div className={styles.vocabularySuggestion}>
                      <span className={styles.suggestionLabel}>Better:</span> {item.suggestion}
                    </div>
                    {item.context && (
                      <div className={styles.vocabularyContext}>{item.context}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fluency Analysis */}
          {fluency && Object.keys(fluency).length > 0 && (
            <div className={styles.section}>
              <h3>Fluency Analysis</h3>
              <div className={styles.fluencyGrid}>
                {fluency.fillerWords && fluency.fillerWords.length > 0 && (
                  <div className={styles.fluencyItem}>
                    <span className={styles.fluencyLabel}>Filler Words:</span>
                    <span>{fluency.fillerWords.join(', ')}</span>
                  </div>
                )}
                {fluency.sentenceComplexity && (
                  <div className={styles.fluencyItem}>
                    <span className={styles.fluencyLabel}>Sentence Complexity:</span>
                    <span className={styles.complexity}>
                      {fluency.sentenceComplexity}
                    </span>
                  </div>
                )}
                {fluency.overallFluency && (
                  <div className={styles.fluencyDescription}>
                    {fluency.overallFluency}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Natural Phrases */}
          {phrases.length > 0 && (
            <div className={styles.section}>
              <h3>More Natural Expressions</h3>
              <div className={styles.phrasesList}>
                {phrases.map((item: any, idx: number) => (
                  <div key={idx} className={styles.phraseItem}>
                    <div className={styles.phraseOriginal}>
                      You said: "{item.original}"
                    </div>
                    <div className={styles.phraseNatural}>
                      More natural: "{item.natural}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics Practiced */}
          {topics.length > 0 && (
            <div className={styles.section}>
              <h3>Topics Practiced</h3>
              <div className={styles.topicsList}>
                {topics.map((topic: string, idx: number) => (
                  <span key={idx} className={styles.topicTag}>{topic}</span>
                ))}
              </div>
            </div>
          )}

          {/* Overall Feedback */}
          {transcript.analysis.overallFeedback && (
            <div className={styles.section}>
              <h3>Overall Feedback</h3>
              <p className={styles.feedback}>{transcript.analysis.overallFeedback}</p>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Failed to parse analysis:', error);
      return (
        <div className={styles.analysisError}>
          Failed to load analysis data
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading transcript...</div>
      </div>
    );
  }

  if (!transcript) {
    return null;
  }

  const entries: TranscriptEntry[] = JSON.parse(transcript.transcriptData);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/conversations')} className={styles.backButton}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Conversations
        </button>
        
        <div className={styles.partnerInfo}>
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
          <div>
            <h1 className={styles.title}>
              Conversation with {transcript.partnerName}
            </h1>
            <p className={styles.date}>
              {formatDate(transcript.conversationDate)}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className={styles.downloadSection}>
          <div className={styles.downloadButtons}>
            <button onClick={() => handleDownload('txt')} className={styles.downloadButton}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              TXT
            </button>
            <button onClick={() => handleDownload('srt')} className={styles.downloadButton}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              SRT
            </button>
            <button onClick={() => handleDownload('pdf')} className={styles.downloadButton}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              PDF
            </button>
          </div>
          
          {transcript.includeAnalysis && transcript.analysis && (
            <div className={styles.toggleContainer}>
              <span className={styles.toggleLabel}>Include analysis in download</span>
              <button
                className={`${styles.toggle} ${includeAnalysisInDownload ? styles.toggleActive : ''}`}
                onClick={() => setIncludeAnalysisInDownload(!includeAnalysisInDownload)}
                role="switch"
                aria-checked={includeAnalysisInDownload}
              >
                <span className={styles.toggleTrack}>
                  <span className={styles.toggleThumb}></span>
                </span>
              </button>
            </div>
          )}
        </div>

        {showAnalysisTab && (
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'transcript' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'analysis' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              AI Analysis
            </button>
          </div>
        )}

        <div className={styles.content}>
          {activeTab === 'transcript' && (
            <div className={styles.transcriptContainer}>
              {entries.map((entry, idx) => (
                <div key={idx} className={styles.entry}>
                  <div className={styles.entryLine}>
                    <div className={styles.entryContent}>
                      <span className={styles.speaker}>{entry.speaker}:</span> {entry.text}
                    </div>
                    <span className={styles.timestamp}>{formatTime(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analysis' && renderAnalysisSection()}
        </div>
      </Card>
    </div>
  );
}
