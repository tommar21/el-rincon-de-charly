import type { GameConfig } from '../registry/types';

export const ticTacToeConfig: GameConfig = {
  slug: 'tic-tac-toe',
  name: 'Tic Tac Toe',
  description: 'El clasico juego de tres en linea',
  icon: 'Grid3X3',
  category: 'board',
  minPlayers: 2,
  maxPlayers: 2,
  supportsAI: true,
  supportsOnline: true,
  supportsBetting: true,
  enabled: true,
};
