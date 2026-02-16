// Feedback types

export type FeedbackType = 'BUG' | 'SUGGESTION' | 'OTHER';
export type FeedbackStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Feedback {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string;
  type: FeedbackType;
  title: string;
  description: string;
  screenshotUrl: string | null;
  screenshotData: string | null;
  pageUrl: string;
  userAgent: string;
  status: FeedbackStatus;
  adminNotes: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackSummary {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string;
  type: FeedbackType;
  title: string;
  status: FeedbackStatus;
  hasScreenshot: boolean;
  createdAt: string;
}

export interface CreateFeedbackRequest {
  type: FeedbackType;
  title: string;
  description: string;
  screenshotData?: string;
  pageUrl: string;
  userAgent: string;
}

export interface UpdateFeedbackStatusRequest {
  status: FeedbackStatus;
}

export interface UpdateAdminNotesRequest {
  notes: string;
}

export interface FeedbackStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  bugs: number;
  suggestions: number;
  other: number;
}
