'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase.types';

// Validate required environment variables
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }
  return key;
}

export function createClient() {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
}

// Singleton for client-side usage
let client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}
