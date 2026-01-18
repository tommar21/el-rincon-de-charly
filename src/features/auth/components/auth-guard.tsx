import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type AuthGuardProps = {
  children: React.ReactNode;
  /** Where to redirect if auth check fails */
  redirectTo?: string;
  /** If true, requires user to be authenticated. If false, requires user to NOT be authenticated */
  requireAuth?: boolean;
};

/**
 * Server component that guards routes based on authentication state.
 * Use in layouts to protect routes or redirect authenticated users.
 *
 * @example
 * // Protected route (requires authentication)
 * <AuthGuard requireAuth redirectTo="/login">
 *   {children}
 * </AuthGuard>
 *
 * @example
 * // Auth route (redirect if already authenticated)
 * <AuthGuard requireAuth={false} redirectTo="/games">
 *   {children}
 * </AuthGuard>
 */
export async function AuthGuard({
  children,
  redirectTo = '/login',
  requireAuth = true,
}: AuthGuardProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (requireAuth && !user) {
    redirect(redirectTo);
  }

  if (!requireAuth && user) {
    redirect(redirectTo);
  }

  return <>{children}</>;
}
