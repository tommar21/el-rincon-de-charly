import type { GameModule } from '../registry/types';
import { Plinko } from './plinko';
import { plinkoConfig } from './config';

const plinkoModule: GameModule = {
  config: plinkoConfig,
  Component: Plinko,
};

export default plinkoModule;

export { Plinko } from './plinko';
export { plinkoConfig } from './config';
export * from './types';
export * from './hooks';
export * from './components';
export * from './engine';
