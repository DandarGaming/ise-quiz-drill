import type { QuestionType, QuizConfig } from '../types/quiz';
import { applyPresetConfig, presets } from './presets';
import { parseQuizJson } from './quizSchema';

// A built-in test anyone can start from the creator. Its settings come from
// the preset with the same id, its questions from a JSON file.
export interface ReadyTest {
  id: string;
  quiz: QuizConfig;
}

export function buildReadyTest(presetId: string, json: unknown): ReadyTest {
  const preset = presets.find((p) => p.id === presetId);
  if (!preset) throw new Error(`Unknown preset ${presetId}`);

  const config = applyPresetConfig(preset);
  const result = parseQuizJson(JSON.stringify(json), {
    title: config.title,
    fallbackId: `ready-${presetId}`,
    timeLimitMinutes: config.timeLimitMinutes,
    templateMode: config.templateMode,
    antiCheat: config.antiCheat,
  });
  if (!result.ok) {
    throw new Error(
      `Ready test ${presetId} is not a valid quiz: ${result.errors.join('; ')}`,
    );
  }
  return { id: presetId, quiz: { ...result.quiz, id: `ready-${presetId}` } };
}

const typeNames: Record<QuestionType, string> = {
  mcq: 'multiple choice',
  'multi-select': 'multi-select',
  'true-false': 'true/false',
  'short-answer': 'short answer',
  'multi-blank': 'fill in the blanks',
};

// One line for the card, e.g. "10 multi-select · 15 min · paginated · proctored"
export function describeReadyTest({ quiz }: ReadyTest): string {
  const types = new Set(quiz.questions.map((q) => q.type));
  const [only] = types;
  const count = quiz.questions.length;
  return [
    types.size === 1 ? `${count} ${typeNames[only]}` : `${count} questions`,
    `${quiz.timeLimitMinutes} min`,
    quiz.templateMode === 'paginated' ? 'paginated' : 'one page',
    ...(quiz.antiCheat?.enabled ? ['proctored'] : []),
  ].join(' · ');
}
