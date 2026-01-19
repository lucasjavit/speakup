/**
 * Types for ratings and relationships.
 */

export type FluencyLevel = 'BASIC' | 'ELEMENTARY' | 'LEVEL_UP' | 'EXPERT';

export interface Rating {
  id: string;
  conversationId: string;
  raterId: string;
  ratedUserId: string;
  stars: number;
  wantToTalkAgain: boolean;
  partnerFluencyLevel: FluencyLevel | null;
  mutualInterest: boolean;
  createdAt: string;
}

export interface SubmitRatingRequest {
  conversationId: string;
  stars: number;
  wantToTalkAgain: boolean;
  partnerFluencyLevel?: FluencyLevel;
}

export interface FavoriteUser {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  isMutual: boolean;
  createdAt: string;
}

export interface BlockUserRequest {
  targetUserId: string;
  conversationId?: string;
}

export interface RelationshipResponse {
  id: string;
  userId: string;
  targetUserId: string;
  type: 'FAVORITE' | 'BLOCK';
  conversationId: string | null;
  createdAt: string;
}
