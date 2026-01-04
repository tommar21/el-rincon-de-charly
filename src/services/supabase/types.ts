export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      game_stats: {
        Row: {
          id: string;
          user_id: string;
          game_type: string;
          games_played: number;
          games_won: number;
          games_lost: number;
          games_draw: number;
          win_streak: number;
          best_win_streak: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_type: string;
          games_played?: number;
          games_won?: number;
          games_lost?: number;
          games_draw?: number;
          win_streak?: number;
          best_win_streak?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          games_played?: number;
          games_won?: number;
          games_lost?: number;
          games_draw?: number;
          win_streak?: number;
          best_win_streak?: number;
          updated_at?: string;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          game_type: string;
          opponent_type: string;
          result: 'win' | 'loss' | 'draw';
          moves: unknown;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_type: string;
          opponent_type: string;
          result: 'win' | 'loss' | 'draw';
          moves?: unknown;
          duration_seconds?: number;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          games_played: number;
          games_won: number;
          win_rate: number;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type GameStats = Database['public']['Tables']['game_stats']['Row'];
export type GameSession = Database['public']['Tables']['game_sessions']['Row'];
