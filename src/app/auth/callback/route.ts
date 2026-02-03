import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Validates and sanitizes the redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with '/'.
 */
function getSafeRedirectPath(next: string | null): string {
  const defaultPath = '/games';

  if (!next) return defaultPath;

  // Only allow relative paths starting with '/'
  // Reject absolute URLs, protocol-relative URLs, and paths with encoded characters
  if (
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('://') ||
    next.includes('%2f') ||
    next.includes('%2F')
  ) {
    return defaultPath;
  }

  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
