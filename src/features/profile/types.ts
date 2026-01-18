export interface GameResult {
  id: string;
  gameType: string;
  opponentType: 'human' | 'ai_easy' | 'ai_medium' | 'ai_hard' | 'ai_impossible' | 'online';
  result: 'win' | 'loss' | 'draw';
  playerSymbol: 'X' | 'O';
  moves: number;
  durationSeconds: number;
  createdAt: string;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDraw: number;
  winStreak: number;
  bestWinStreak: number;
  totalPlayTime: number; // seconds
  byOpponent: Record<string, {
    played: number;
    won: number;
    lost: number;
    draw: number;
  }>;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatarUrl?: string;
  gamesWon: number;
  gamesPlayed: number;
  winRate: number;
  rank: number;
}

// DB row type
export interface GameStatsRow {
  id: string;
  user_id: string;
  game_type: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_draw: number;
  win_streak: number;
  best_win_streak: number;
  total_play_time: number;
  by_opponent: Record<string, { played: number; won: number; lost: number; draw: number }>;
  updated_at: string;
}
