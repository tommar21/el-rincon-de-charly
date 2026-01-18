export { useAuth } from './hooks/use-auth';
export { useAuthStore } from './store/auth-store';
export { AuthModal, UserMenu } from './components';
export type { Profile, AuthState } from './types';

// Server component - import directly where needed:
// import { AuthGuard } from '@/features/auth/components/auth-guard';
