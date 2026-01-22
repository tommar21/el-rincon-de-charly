import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  win_rate: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Discriminated union for auth status.
 * Provides better type safety than nullable fields.
 *
 * @example
 * ```ts
 * function renderUser(auth: AuthStatus) {
 *   switch (auth.status) {
 *     case 'loading':
 *       return <Spinner />;
 *     case 'unauthenticated':
 *       return <LoginButton />;
 *     case 'authenticated':
 *       // TypeScript knows user and session are defined here
 *       return <UserProfile user={auth.user} />;
 *   }
 * }
 * ```
 */
export type AuthStatus =
  | { status: 'loading' }
  | { status: 'unauthenticated'; user: null; session: null; profile: null }
  | { status: 'authenticated'; user: User; session: Session; profile: Profile | null };

/**
 * Helper to derive AuthStatus from current AuthState
 */
export function getAuthStatus(state: AuthState): AuthStatus {
  if (state.isLoading) {
    return { status: 'loading' };
  }
  if (!state.isAuthenticated || !state.user || !state.session) {
    return { status: 'unauthenticated', user: null, session: null, profile: null };
  }
  return { status: 'authenticated', user: state.user, session: state.session, profile: state.profile };
}

/**
 * Legacy AuthState interface for backwards compatibility.
 * Consider using AuthStatus for new code.
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;
