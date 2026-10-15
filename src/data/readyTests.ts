import { buildReadyTest, type ReadyTest } from '../utils/readyTests';
import devops from './ready-tests/devops.json';
import itg from './ready-tests/itg.json';

// Built-in tests on the creator. Each one is a quiz JSON file in
// src/data/ready-tests plus the preset with the same id for its settings.
export const readyTests: ReadyTest[] = [
  buildReadyTest('devops', devops),
  buildReadyTest('itg', itg),
];
