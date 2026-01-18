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
