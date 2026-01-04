import { useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';
import { useAuthStore } from '../store/authStore';
import { useStatsStore } from '../../profile/store/statsStore';
import type { Profile } from '../../../services/supabase/types';

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

  const setStatsUserId = useStatsStore((state) => state.setUserId);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    setProfile(data as Profile);
    return data;
  }, [setProfile]);

  // Sign up with email
  const signUp = useCallback(async (email: string, password: string, username: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      return { error };
    }

    // Update profile with username (trigger creates it, we update it)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
      } as never, { onConflict: 'id' });
    }

    return { data, error: null };
  }, []);

  // Sign in with email
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  }, []);

  // Sign in with Google
  const signInWithProvider = useCallback(async (provider: 'google') => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    return { data, error };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setStatsUserId(null);
    reset();
  }, [reset, setStatsUserId]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!supabase || !user) {
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
  }, [user, setProfile]);

  // Validate session - check if user still exists
  const validateSession = useCallback(async (userId: string) => {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // User doesn't exist anymore, clear session
        console.warn('Session invalid - user not found, logging out');
        await supabase.auth.signOut();
        reset();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }, [reset]);

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Validate that user still exists
        const isValid = await validateSession(session.user.id);
        if (isValid) {
          setSession(session);
          setUser(session.user);
          setStatsUserId(session.user.id);
          fetchProfile(session.user.id);
        }
      } else {
        setSession(null);
        setUser(null);
        setStatsUserId(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setStatsUserId(session.user.id);
          await fetchProfile(session.user.id);
        } else {
          setStatsUserId(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setProfile, setLoading, fetchProfile, validateSession, setStatsUserId]);

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    isConfigured: isSupabaseConfigured(),
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    updateProfile,
    fetchProfile,
  };
}

export default useAuth;
