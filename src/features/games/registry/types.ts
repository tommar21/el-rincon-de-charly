import type { ComponentType } from 'react';

/**
 * Game category for filtering and organization
 */
export type GameCategory = 'board' | 'card' | 'casino' | 'puzzle';

/**
 * Game mode options
 */
export type GameMode = 'local' | 'ai' | 'online' | 'betting';

/**
 * AI difficulty levels
 */
export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'impossible';

/**
 * Player interface for game participants
 */
export interface Player {
  id: string;
  name: string;
  avatar?: string;
  isAI: boolean;
  difficulty?: AIDifficulty;
}

/**
 * Game configuration - defines the game's capabilities and metadata
 */
export interface GameConfig {
  /** Unique slug for routing (e.g., 'tic-tac-toe') */
  slug: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Emoji or icon identifier */
  icon: string;
  /** Game category */
  category: GameCategory;
  /** Minimum players required */
  minPlayers: number;
  /** Maximum players allowed */
  maxPlayers: number;
  /** Supports AI opponent */
  supportsAI: boolean;
  /** Available AI difficulties */
  aiDifficulties?: AIDifficulty[];
  /** Supports online multiplayer */
  supportsOnline: boolean;
  /** Supports betting mode */
  supportsBetting: boolean;
  /** Whether the game is enabled/available */
  enabled: boolean;
  /** Thumbnail image path */
  thumbnail?: string;
}

/**
 * Game result after a match
 */
export interface GameResult {
  /** Winner's player ID (null for draw) */
  winnerId: string | null;
  /** Whether the game was a draw */
  isDraw: boolean;
  /** Game duration in seconds */
  durationSeconds: number;
  /** Number of moves/turns */
  moves: number;
  /** Opponent type for stats */
  opponentType: 'human' | 'ai_easy' | 'ai_medium' | 'ai_hard' | 'ai_impossible' | 'online';
}

/**
 * Props passed to game components
 */
export interface GameProps {
  /** Current game mode */
  mode: GameMode;
  /** Online room ID (for online mode) */
  roomId?: string;
  /** AI difficulty (for AI mode) */
  aiDifficulty?: AIDifficulty;
  /** Initial game state (for resuming) */
  initialState?: unknown;
  /** Callback when game ends */
  onGameEnd?: (result: GameResult) => void;
  /** Callback to go back to hub/menu */
  onBack?: () => void;
}

/**
 * Game engine interface - implements game logic
 * This is optional and used for server-side validation
 */
export interface GameEngine<TState = unknown, TMove = unknown> {
  /** Get initial game state */
  getInitialState(): TState;
  /** Check if a move is valid */
  isValidMove(state: TState, move: TMove, playerId: string): boolean;
  /** Apply a move and return new state */
  applyMove(state: TState, move: TMove, playerId: string): TState;
  /** Get the winner (null if no winner yet) */
  getWinner(state: TState): string | null;
  /** Check if the game is a draw */
  isDraw(state: TState): boolean;
  /** Get AI move for given difficulty */
  getAIMove(state: TState, difficulty: AIDifficulty): TMove;
  /** Get all valid moves for a player */
  getValidMoves(state: TState, playerId: string): TMove[];
}

/**
 * Complete game module export
 */
export interface GameModule {
  /** Game configuration */
  config: GameConfig;
  /** React component for the game */
  Component: ComponentType<GameProps>;
  /** Optional game engine for server-side validation */
  Engine?: new () => GameEngine;
}
