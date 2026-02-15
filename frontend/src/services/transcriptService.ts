import axios from '@/lib/axios';

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface SaveTranscriptRequest {
  conversationId: string;
  transcriptData: string; // JSON string of TranscriptEntry[]
  includeAnalysis: boolean;
}

export interface TranscriptDTO {
  id: string;
  conversationId: string;
  requesterId: string;
  transcriptData: string;
  includeAnalysis: boolean;
  analysisStatus: 'NOT_REQUESTED' | 'PENDING' | 'COMPLETED' | 'FAILED';
  errorMessage: string | null;
  createdAt: string;
}

export interface TranscriptSummaryDTO {
  id: string;
  conversationId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  conversationDate: string;
  hasAnalysis: boolean;
  analysisStatus: 'NOT_REQUESTED' | 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface AnalysisDTO {
  id: string;
  grammarCorrections: string; // JSON
  vocabularySuggestions: string; // JSON
  fluencyAnalysis: string; // JSON
  estimatedLevel: string;
  naturalPhrases: string; // JSON
  topicsPracticed: string; // JSON
  overallFeedback: string;
  tokensUsed: number;
}

export interface TranscriptWithAnalysisDTO {
  id: string;
  conversationId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  conversationDate: string;
  conversationDurationSeconds: number | null;
  transcriptData: string;
  includeAnalysis: boolean;
  analysisStatus: 'NOT_REQUESTED' | 'PENDING' | 'COMPLETED' | 'FAILED';
  errorMessage: string | null;
  analysis: AnalysisDTO | null;
  createdAt: string;
}

export interface TranscriptQuotaDTO {
  available: number;
  limit: number;
  resetsAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class TranscriptService {
  private baseUrl = '/transcripts';

  /**
   * Check if transcript feature is enabled.
   */
  async isFeatureEnabled(): Promise<boolean> {
    try {
      const response = await axios.get<{ data: { enabled: boolean } }>(`${this.baseUrl}/feature-status`);
      return response.data.data.enabled;
    } catch (error) {
      console.error('Failed to check transcript feature status:', error);
      return false;
    }
  }

  /**
   * Save a conversation transcript.
   */
  async saveTranscript(request: SaveTranscriptRequest): Promise<TranscriptDTO> {
    const response = await axios.post<TranscriptDTO>(this.baseUrl, request);
    return response.data;
  }

  /**
   * Get user's transcripts (paginated).
   */
  async getUserTranscripts(page: number = 0, size: number = 20): Promise<Page<TranscriptSummaryDTO>> {
    const response = await axios.get<Page<TranscriptSummaryDTO>>(this.baseUrl, {
      params: { page, size },
    });
    return response.data;
  }

  /**
   * Get transcript details with analysis.
   */
  async getTranscriptDetails(id: string): Promise<TranscriptWithAnalysisDTO> {
    const response = await axios.get<TranscriptWithAnalysisDTO>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Request AI analysis for a transcript.
   * @throws Error with message from backend on 409 (e.g. analysis already completed)
   */
  async requestAnalysis(id: string): Promise<TranscriptDTO> {
    try {
      const response = await axios.post<TranscriptDTO>(`${this.baseUrl}/${id}/analyze`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        const msg = error.response?.data?.error?.message ?? 'Analysis already completed or in progress.';
        throw new Error(msg);
      }
      throw error;
    }
  }

  /**
   * Get user's transcript quota.
   */
  async getQuota(): Promise<TranscriptQuotaDTO> {
    const response = await axios.get<TranscriptQuotaDTO>(`${this.baseUrl}/quota`);
    return response.data;
  }

  /**
   * Download transcript as TXT file.
   */
  downloadTxt(
    transcript: TranscriptWithAnalysisDTO,
    includeAnalysis: boolean
  ): void {
    const entries: TranscriptEntry[] = JSON.parse(transcript.transcriptData);
    const date = new Date(transcript.conversationDate).toLocaleString();

    let content = `Conversation with ${transcript.partnerName}\n`;
    content += `Date: ${date}\n\n`;
    content += `=== Transcript ===\n\n`;

    entries.forEach(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      content += `[${timestamp}] ${entry.speaker}: ${entry.text}\n`;
    });

    if (includeAnalysis && transcript.analysis) {
      content += `\n\n=== AI Analysis ===\n\n`;
      content += `Estimated Level: ${transcript.analysis.estimatedLevel}\n\n`;
      
      try {
        const grammar = JSON.parse(transcript.analysis.grammarCorrections);
        if (grammar && grammar.length > 0) {
          content += `Grammar Corrections:\n`;
          grammar.forEach((item: any, idx: number) => {
            content += `${idx + 1}. "${item.original}" → "${item.corrected}"\n   ${item.explanation}\n`;
          });
          content += '\n';
        }
      } catch (e) {
        // Skip if JSON parsing fails
      }

      content += `Overall Feedback:\n${transcript.analysis.overallFeedback}\n`;
    }

    this.downloadFile(content, `transcript-${transcript.id}.txt`, 'text/plain');
  }

  /**
   * Download transcript as SRT file (subtitle format).
   */
  downloadSrt(transcript: TranscriptWithAnalysisDTO): void {
    const entries: TranscriptEntry[] = JSON.parse(transcript.transcriptData);
    let content = '';
    let counter = 1;

    entries.forEach((entry, idx) => {
      const startTime = this.msToSrtTime(entry.timestamp - entries[0].timestamp);
      const endTime = idx < entries.length - 1
        ? this.msToSrtTime(entries[idx + 1].timestamp - entries[0].timestamp)
        : this.msToSrtTime(entry.timestamp - entries[0].timestamp + 3000); // +3s for last entry

      content += `${counter}\n`;
      content += `${startTime} --> ${endTime}\n`;
      content += `${entry.speaker}: ${entry.text}\n\n`;
      counter++;
    });

    this.downloadFile(content, `transcript-${transcript.id}.srt`, 'text/srt');
  }

  /**
   * Download transcript as PDF file using screen capture.
   * This creates a visual "print" of the currently displayed content.
   */
  async downloadPdf(
    elementId: string,
    filename: string
  ): Promise<void> {
    // Dynamic imports
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Get the element to capture
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF generation');
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // If content is too tall, split into multiple pages
    if (imgHeight > 297) { // A4 height
      let position = -297;
      while (position > -imgHeight) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        position -= 297;
      }
    }

    // Save PDF
    pdf.save(filename);
  }

  /**
   * Convert milliseconds to SRT timestamp format (HH:MM:SS,mmm).
   */
  private msToSrtTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  /**
   * Helper to download file.
   */
  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const transcriptService = new TranscriptService();
