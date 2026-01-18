import type { GameModule } from '../registry/types';
import { TicTacToe } from './tic-tac-toe';
import { ticTacToeConfig } from './config';

// Export the game module
const ticTacToeModule: GameModule = {
  config: ticTacToeConfig,
  Component: TicTacToe,
};

export default ticTacToeModule;

// Named exports for convenience
export { TicTacToe } from './tic-tac-toe';
export { ticTacToeConfig } from './config';
export * from './types';
export * from './hooks';
export * from './components';
