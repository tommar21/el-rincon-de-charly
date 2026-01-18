import { gameRegistry } from './index';

/**
 * Dynamic game loader
 * Registers all available games with the registry
 *
 * This file should import and register all game modules
 * Games are lazy-loaded when accessed
 */
export async function loadGames(): Promise<void> {
  // Import game modules dynamically
  // Each game module should export: { config, Component, Engine? }

  // Tic Tac Toe
  const ticTacToe = await import('../tic-tac-toe');
  gameRegistry.register(ticTacToe.default);

  // Add more games here as they are implemented:
  // const connectFour = await import('../connect-four');
  // gameRegistry.register(connectFour.default);

  // const plinko = await import('../plinko');
  // gameRegistry.register(plinko.default);

  // const chess = await import('../chess');
  // gameRegistry.register(chess.default);
}

/**
 * Get a game component by slug (for dynamic routing)
 */
export function getGameComponent(slug: string) {
  const game = gameRegistry.get(slug);
  return game?.Component;
}

/**
 * Check if a game slug is valid
 */
export function isValidGameSlug(slug: string): boolean {
  return gameRegistry.has(slug);
}
