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

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  nativeLanguage?: Language;
  targetLanguage?: Language;
  proficiencyLevel?: ProficiencyLevel;
  timezone?: string;
  profileCompleted: boolean;
  active: boolean;
  createdAt: string;
}

export interface CompleteProfileRequest {
  nativeLanguage: Language;
  targetLanguage: Language;
  proficiencyLevel: ProficiencyLevel;
  timezone?: string;
}
