export type AuthProvider = 'GOOGLE' | 'GITHUB';

export type Language =
  | 'ENGLISH'
  | 'PORTUGUESE'
  | 'SPANISH'
  | 'FRENCH'
  | 'GERMAN'
  | 'ITALIAN'
  | 'JAPANESE'
  | 'KOREAN'
  | 'MANDARIN';

export type ProficiencyLevel = 'BASIC' | 'ELEMENTARY' | 'LEVEL_UP' | 'EXPERT';

export type Role = 'USER' | 'MODERATOR' | 'PAYMENT_ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: AuthProvider;
  maskedIdNumber?: string;  // ID number is now masked for privacy (GDPR)
  country?: string;
  city?: string;
  address?: string;
  nativeLanguage?: Language;
  targetLanguage?: Language;
  proficiencyLevel?: ProficiencyLevel;
  evaluatedLevel?: ProficiencyLevel;
  totalEvaluations?: number;
  timezone?: string;
  profileCompleted: boolean;
  active: boolean;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

// ==================== GDPR/LGPD Types ====================

export type ConsentType = 'DATA_PROCESSING' | 'RECORDING' | 'MARKETING';

export interface UserConsent {
  consentType: ConsentType;
  consented: boolean;
  consentedAt?: string;
  withdrawnAt?: string;
}

export interface ConsentRequest {
  consentType: ConsentType;
}

export interface UserProfileExport {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  idNumber?: string;  // Unmasked in export (user's own data)
  country?: string;
  city?: string;
  address?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
  proficiencyLevel?: string;
  timezone?: string;
  profileCompleted: boolean;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationExport {
  id: string;
  partnerName: string;
  topic?: string;
  durationSeconds?: number;
  recordingUrl?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface RatingExport {
  conversationId: string;
  stars: number;
  comment?: string;
  wantToTalkAgain: boolean;
  createdAt: string;
}

export interface UserDataExport {
  profile: UserProfileExport;
  consents: UserConsent[];
  conversations: ConversationExport[];
  ratings: RatingExport[];
  exportedAt: string;
}

export interface CompleteProfileRequest {
  idNumber: string;
  country: string;
  city: string;
  address?: string;
  nativeLanguage: Language;
  targetLanguage: Language;
  proficiencyLevel: ProficiencyLevel;
  timezone?: string;
}

// Admin types
export type SessionStatus = 'ACTIVE' | 'INACTIVE';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface Session {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: DayOfWeek[];
  status: SessionStatus;
  currentlyRunning: boolean;
  callDurationSeconds: number;
  breakDurationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: DayOfWeek[];
  callDurationSeconds?: number;
  breakDurationSeconds?: number;
}

export interface UpdateSessionRequest {
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek: DayOfWeek[];
  callDurationSeconds?: number;
  breakDurationSeconds?: number;
}

/**
 * @deprecated Use User instead. AdminUser is kept for backward compatibility.
 */
export type AdminUser = User;

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  currentlyRunningSessions: number;
}
