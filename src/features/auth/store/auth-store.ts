'use client';

import { create } from 'zustand';
import type { AuthStore } from '../types';

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    isAuthenticated: false,
  }),
}));

// Optimized selectors - prevent unnecessary re-renders
export const useUser = () => useAuthStore((s) => s.user);
export const useSession = () => useAuthStore((s) => s.session);
export const useProfile = () => useAuthStore((s) => s.profile);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthActions = () =>
  useAuthStore((s) => ({
    setUser: s.setUser,
    setSession: s.setSession,
    setProfile: s.setProfile,
    setLoading: s.setLoading,
    reset: s.reset,
  }));
