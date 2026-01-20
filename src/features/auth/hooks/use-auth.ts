'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '../store/auth-store';
import type { Profile } from '../types';

export function useAuth() {
  const {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    setUser,
    setSession,
    setProfile,
    setLoading,
    reset,
  } = useAuthStore();

  const supabase = getClient();

  // Track if initial session load is complete to prevent race condition
  const initialLoadCompleteRef = useRef(false);
  // Track if we're in the middle of a session refresh (prevents false SIGNED_OUT)
  const isRefreshingSessionRef = useRef(false);
  // Track current profile fetch to prevent stale data
  const currentProfileFetchRef = useRef<string | null>(null);

  // Fetch user profile with proper error handling and race condition prevention
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Track this fetch to detect if a newer one started
    const fetchId = userId;
    currentProfileFetchRef.current = fetchId;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // If a newer fetch started, discard this result
      if (currentProfileFetchRef.current !== fetchId) {
        return null;
      }

      if (error) {
        // PGRST116 = no rows found - profile might not exist yet (trigger delay)
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for user:', userId);
          // Retry once after short delay (trigger might be slow)
          await new Promise(resolve => setTimeout(resolve, 500));
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (!retryError && retryData && currentProfileFetchRef.current === fetchId) {
            setProfile(retryData as Profile);
            return retryData as Profile;
          }
        }
        console.error('Error fetching profile:', error);
        return null;
      }

      setProfile(data as Profile);
      return data as Profile;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  }, [supabase, setProfile]);

  // Sign up with email and verify profile creation
  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error };
    }

    // Check if user already exists (Supabase returns user with empty identities)
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return {
        error: {
          message: 'Este email ya esta registrado. Intenta iniciar sesion o usa otro email.'
        }
      };
    }

    return { data, error: null };
  }, [supabase]);

  // Sign in with email
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  }, [supabase]);

  // Sign in with Google
  const signInWithProvider = useCallback(async (provider: 'google') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { data, error };
  }, [supabase]);

  // Sign out - let onAuthStateChange handle state reset
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Don't call reset() here - onAuthStateChange will handle it
    // This prevents state update after potential unmount
  }, [supabase]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: 'Not authenticated' } };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates as never)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }

    return { data, error };
  }, [user, supabase, setProfile]);

  // Store ref to fetchProfile to avoid effect dependency changes
  const fetchProfileRef = useRef(fetchProfile);
  fetchProfileRef.current = fetchProfile;

  // Initialize auth state - runs once on mount
  useEffect(() => {
    let mounted = true;

    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        // Skip if initial load hasn't completed yet (avoid race condition)
        if (!initialLoadCompleteRef.current && event !== 'SIGNED_OUT') {
          return;
        }

        // Ignore SIGNED_OUT if we're in the middle of a session refresh
        // This prevents false logouts during token refresh when opening shared links
        if (event === 'SIGNED_OUT' && isRefreshingSessionRef.current) {
          console.log('[Auth] Ignoring SIGNED_OUT during session refresh');
          return;
        }

        // On SIGNED_OUT, clear all state
        if (event === 'SIGNED_OUT' || !newSession?.user) {
          reset();
          setLoading(false);
          return;
        }

        // For other events with a valid session
        setSession(newSession);
        setUser(newSession.user);
        setLoading(false);

        // Fetch profile with error handling
        try {
          await fetchProfileRef.current(newSession.user.id);
        } catch (err) {
          console.error('Error fetching profile in auth listener:', err);
          // Don't crash the listener, just log
        }
      }
    );

    // Then do initial session check
    const initSession = async () => {
      try {
        // Mark that we're refreshing session to prevent false SIGNED_OUT events
        isRefreshingSessionRef.current = true;

        // getUser() makes a network request and refreshes the token if expired
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        // Session refresh complete
        isRefreshingSessionRef.current = false;

        if (!mounted) return;

        if (userError || !authUser) {
          // No valid user - ensure clean state
          reset();
          setLoading(false);
          initialLoadCompleteRef.current = true;
          return;
        }

        // Get the session
        const { data: { session: authSession } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (authSession?.user) {
          setSession(authSession);
          setUser(authSession.user);

          try {
            await fetchProfileRef.current(authSession.user.id);
          } catch (err) {
            console.error('Error fetching initial profile:', err);
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        if (mounted) {
          reset();
        }
      } finally {
        if (mounted) {
          setLoading(false);
          // Mark initial load complete - now listener can handle events
          initialLoadCompleteRef.current = true;
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, setSession, setUser, setProfile, setLoading, reset]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    updateProfile,
    fetchProfile,
  }), [
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    updateProfile,
    fetchProfile,
  ]);
}

export default useAuth;
