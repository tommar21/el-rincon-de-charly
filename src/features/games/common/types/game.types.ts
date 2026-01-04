import type { ComponentType } from 'react';

// Game configuration interface
export interface GameConfig {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  supportsAI: boolean;
  supportsOnline: boolean;
  thumbnail: string;
  category: GameCategory;
}

export type GameCategory = 'board' | 'card' | 'puzzle' | 'strategy';

export type GameStatus = 'idle' | 'playing' | 'finished' | 'paused';

export type GameMode = 'local' | 'ai' | 'online';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isAI: boolean;
  difficulty?: AIDifficulty;
}

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'impossible';

export interface GameState<T = unknown> {
  status: GameStatus;
  mode: GameMode;
  players: Player[];
  currentPlayerIndex: number;
  winner: Player | null;
  isDraw: boolean;
  gameData: T;
  history: GameMove[];
  startedAt: Date | null;
  endedAt: Date | null;
}

export interface GameMove {
  playerId: string;
  timestamp: Date;
  data: unknown;
}

// Interface that each game must implement
export interface GameEngine<TState, TMove> {
  getInitialState(): TState;
  isValidMove(state: TState, move: TMove, playerId: string): boolean;
  applyMove(state: TState, move: TMove, playerId: string): TState;
  checkWinner(state: TState): string | null;
  checkDraw(state: TState): boolean;
  getAIMove(state: TState, difficulty: AIDifficulty): TMove;
}

// Props that all game components receive
export interface GameProps {
  mode: GameMode;
  players: Player[];
  onGameEnd?: (winner: Player | null, isDraw: boolean) => void;
}

// Game registry entry
export interface GameRegistryEntry {
  config: GameConfig;
  component: ComponentType<GameProps>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  engine: GameEngine<any, any>;
}
