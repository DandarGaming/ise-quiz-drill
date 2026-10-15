import type { AntiCheatOptions } from '../types/quiz';
import data from './presets.json';
import {
  defaultPromptOptions,
  defaultTestConfig,
  type PromptOptions,
  type TestConfig,
} from './promptBuilder';

// A null field means "keep the app default"
type OrNull<T> = { [K in keyof T]: T[K] | null };

export interface Preset {
  id: string;
  name: string;
  prompt: OrNull<PromptOptions>;
  config: Omit<OrNull<TestConfig>, 'antiCheat'> & {
    antiCheat: OrNull<AntiCheatOptions>;
  };
}

// Edit presets.json to add or change a preset; the "_help" entry is ignored
export const presets: Preset[] = data.presets as Preset[];

const pick = <T>(value: T | null, fallback: T): T => value ?? fallback;

// Both apply functions return new objects, so the form can edit the result
// without touching the preset or the defaults.
export function applyPresetPrompt({ prompt }: Preset): PromptOptions {
  const d = defaultPromptOptions;
  return {
    questionCount: pick(prompt.questionCount, d.questionCount),
    difficulty: pick(prompt.difficulty, d.difficulty),
    mix: { ...pick(prompt.mix, d.mix) },
    topics: pick(prompt.topics, d.topics),
    types: [...pick(prompt.types, d.types)],
    notes: pick(prompt.notes, d.notes),
  };
}

export function applyPresetConfig({ config }: Preset): TestConfig {
  const d = defaultTestConfig;
  return {
    title: pick(config.title, d.title),
    timeLimitMinutes: pick(config.timeLimitMinutes, d.timeLimitMinutes),
    templateMode: pick(config.templateMode, d.templateMode),
    antiCheat: {
      enabled: pick(config.antiCheat.enabled, d.antiCheat.enabled),
      tabLock: pick(config.antiCheat.tabLock, d.antiCheat.tabLock),
      uiRestrictions: pick(
        config.antiCheat.uiRestrictions,
        d.antiCheat.uiRestrictions,
      ),
      fullscreenLock: pick(
        config.antiCheat.fullscreenLock,
        d.antiCheat.fullscreenLock,
      ),
    },
  };
}

export const resetPromptOptions = (): PromptOptions => ({
  ...defaultPromptOptions,
  mix: { ...defaultPromptOptions.mix },
  types: [...defaultPromptOptions.types],
});

export const resetTestConfig = (): TestConfig => ({
  ...defaultTestConfig,
  antiCheat: { ...defaultTestConfig.antiCheat },
});
