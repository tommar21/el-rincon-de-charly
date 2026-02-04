import type { GameConfig } from '../registry/types';

export const plinkoConfig: GameConfig = {
  slug: 'plinko',
  name: 'Plinko',
  description: 'Deja caer la bola y gana multiplicadores',
  icon: 'Pyramid',
  category: 'casino',
  minPlayers: 1,
  maxPlayers: 1,
  supportsAI: false,
  supportsOnline: false,
  supportsBetting: true,
  enabled: true,
};
