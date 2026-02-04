import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase.types';
import { proxyLogger } from '@/lib/utils/logger';

/**
 * Next.js Proxy for Supabase session refresh.
 * This runs on every request and refreshes the auth token if expired.
 * Authentication logic should be handled in layouts, not here.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Refresh the session - this validates and refreshes the token if expired
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Log auth errors but don't block the request
      // Common errors: invalid token, expired refresh token
      proxyLogger.warn('Auth error during token refresh:', error.message);

      // If it's an auth error, we should clear the invalid session cookies
      // The client will handle re-authentication
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        // Clear auth cookies by setting them to expire
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
      }
    }
  } catch (err) {
    // Unexpected error - log but don't block request
    proxyLogger.error('Unexpected error during auth check:', err);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
