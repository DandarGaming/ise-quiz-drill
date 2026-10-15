import type { ReadyTest } from '../utils/readyTests';

// Built-in tests on the creator. Each one is a quiz JSON file in
// src/data/ready-tests plus the preset with the same id for its settings:
// buildReadyTest('devops', devopsJson). Cards show only when this has entries.
export const readyTests: ReadyTest[] = [];
