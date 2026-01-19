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

export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type Role = 'USER' | 'MODERATOR' | 'PAYMENT_ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider?: AuthProvider;
  nativeLanguage?: Language;
  targetLanguage?: Language;
  proficiencyLevel?: ProficiencyLevel;
  timezone?: string;
  profileCompleted: boolean;
  active: boolean;
  role: Role;
  createdAt: string;
  updatedAt?: string;
}

export interface CompleteProfileRequest {
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
