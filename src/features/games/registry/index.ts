import type { GameConfig, GameModule, GameCategory } from './types';

/**
 * Game Registry - Central registry for all games
 * Allows dynamic registration and lookup of game modules
 */
class GameRegistry {
  private games = new Map<string, GameModule>();

  /**
   * Register a game module
   * Silently overwrites if already registered (expected with HMR)
   */
  register(game: GameModule): void {
    this.games.set(game.config.slug, game);
  }

  /**
   * Get a game module by slug
   */
  get(slug: string): GameModule | undefined {
    return this.games.get(slug);
  }

  /**
   * Check if a game exists
   */
  has(slug: string): boolean {
    return this.games.has(slug);
  }

  /**
   * Get all registered game configs
   */
  getAll(): GameConfig[] {
    return Array.from(this.games.values()).map((g) => g.config);
  }

  /**
   * Get only enabled games
   */
  getEnabled(): GameConfig[] {
    return this.getAll().filter((g) => g.enabled);
  }

  /**
   * Get games by category
   */
  getByCategory(category: GameCategory): GameConfig[] {
    return this.getEnabled().filter((g) => g.category === category);
  }

  /**
   * Get games that support AI
   */
  getWithAI(): GameConfig[] {
    return this.getEnabled().filter((g) => g.supportsAI);
  }

  /**
   * Get games that support online multiplayer
   */
  getWithOnline(): GameConfig[] {
    return this.getEnabled().filter((g) => g.supportsOnline);
  }

  /**
   * Get games that support betting
   */
  getWithBetting(): GameConfig[] {
    return this.getEnabled().filter((g) => g.supportsBetting);
  }

  /**
   * Get total count of registered games
   */
  get count(): number {
    return this.games.size;
  }

  /**
   * Get count of enabled games
   */
  get enabledCount(): number {
    return this.getEnabled().length;
  }
}

// Export singleton instance
export const gameRegistry = new GameRegistry();

// Re-export types
export * from './types';
