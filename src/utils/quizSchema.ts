import { z } from 'zod';
import {
  QUESTION_TYPES,
  type AntiCheatOptions,
  type Question,
  type QuizAttemptRecord,
  type QuizConfig,
  type TemplateMode,
} from '../types/quiz';

const CHOICE_TYPES = new Set(['mcq', 'multi-select', 'true-false']);

const optionSchema = z.object({
  id: z.string().trim().min(1, 'Each option needs an id.'),
  text: z.string().trim().min(1, 'Each option needs text.'),
});

const questionSchema = z
  .object({
    id: z.string().nullish(),
    number: z.number().int().positive().nullish(),
    type: z.enum(QUESTION_TYPES),
    difficulty: z.enum(['easy', 'medium', 'hard']).nullish(),
    prompt: z.string().trim().min(1, 'Add the question text.'),
    codeSnippet: z.string().nullish(),
    codeLanguage: z.string().nullish(),
    points: z.number().positive().nullish(),
    options: z.array(optionSchema).nullish(),
    correctAnswer: z.union([z.string(), z.array(z.string())], {
      error: 'Add the correct answer.',
    }),
    explanation: z.string().nullish(),
  })
  .superRefine((q, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const answer = q.correctAnswer;

    if (CHOICE_TYPES.has(q.type)) {
      const ids = (q.options ?? []).map((o) => o.id);
      if (ids.length < 2)
        return fail(`${q.type} questions need at least two options.`);
      const notAnOption = (id: string) =>
        `correctAnswer "${id}" is not one of the option ids (${ids.join(', ')}).`;
      if (q.type === 'multi-select') {
        if (!Array.isArray(answer) || answer.length === 0) {
          return fail(
            'multi-select needs correctAnswer as a list of option ids.',
          );
        }
        const missing = answer.find((id) => !ids.includes(id));
        if (missing !== undefined) fail(notAnOption(missing));
      } else if (typeof answer !== 'string') {
        fail(`${q.type} needs correctAnswer as a single option id.`);
      } else if (!ids.includes(answer)) {
        fail(notAnOption(answer));
      }
    }

    if (q.type === 'short-answer') {
      const accepted = Array.isArray(answer) ? answer : [answer];
      if (accepted.length === 0 || accepted.some((a) => a.trim() === '')) {
        fail('short-answer needs a non-empty correctAnswer.');
      }
    }

    if (q.type === 'multi-blank') {
      const blanks = q.prompt.split('[BLANK]').length - 1;
      if (blanks === 0) return fail('the prompt has no [BLANK] markers.');
      if (!Array.isArray(answer)) {
        return fail(
          'multi-blank needs correctAnswer as a list, one per blank.',
        );
      }
      if (answer.length !== blanks) {
        fail(
          `the prompt has ${blanks} [BLANK] markers but correctAnswer has ${answer.length} ${answer.length === 1 ? 'answer' : 'answers'}.`,
        );
      }
    }
  });

const quizFields = {
  id: z.string().nullish(),
  title: z.string().trim().min(1, 'Add a quiz title.'),
  courseCode: z.string().nullish(),
  description: z.string().nullish(),
  questions: z.array(questionSchema).min(1, 'Add at least one question.'),
};

function uniqueQuestionIds(
  quiz: { questions: { id?: string | null }[] },
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  quiz.questions.forEach((q, index) => {
    const id = q.id?.trim() || `q${index + 1}`;
    if (seen.has(id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['questions', index],
        message: `id "${id}" is already used by another question.`,
      });
    }
    seen.add(id);
  });
}

// What an AI returns: settings like the time limit come from the creator
const quizSchema = z.object(quizFields).superRefine(uniqueQuestionIds);

// A quiz as saved in the browser, with every setting filled in
const storedQuizSchema = z
  .object({
    ...quizFields,
    id: z.string().min(1),
    templateMode: z.enum(['paginated', 'single-page']),
    timeLimitMinutes: z.number().positive(),
    questionsPerPage: z.number().int().positive(),
    antiCheat: z
      .object({
        enabled: z.boolean(),
        tabLock: z.boolean(),
        uiRestrictions: z.boolean(),
        fullscreenLock: z.boolean(),
      })
      .optional(),
  })
  .superRefine(uniqueQuestionIds);

const attemptRecordSchema = z.object({
  id: z.string().min(1),
  quizId: z.string(),
  quizTitle: z.string(),
  courseCode: z.string(),
  timestamp: z.string(),
  earnedScore: z.number(),
  totalPoints: z.number(),
  percentage: z.number(),
  timeTakenSeconds: z.number(),
  eventLog: z.array(z.object({ type: z.string(), timestamp: z.string() })),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  quizSnapshot: storedQuizSchema,
});

export const isStoredQuiz = (value: unknown): value is QuizConfig =>
  storedQuizSchema.safeParse(value).success;

export const isAttemptRecord = (value: unknown): value is QuizAttemptRecord =>
  attemptRecordSchema.safeParse(value).success;

// Choices made in the creator, which win over what the AI wrote
export interface ImportSettings {
  title?: string;
  fallbackId: string;
  timeLimitMinutes: number;
  templateMode: TemplateMode;
  antiCheat: AntiCheatOptions;
}

export type ParseResult =
  { ok: true; quiz: QuizConfig } | { ok: false; error: string };

function describeIssue(issue: z.core.$ZodIssue): string {
  const [first, index, field] = issue.path;
  if (first === 'questions' && typeof index === 'number') {
    const where = `Question ${index + 1}:`;
    return field === undefined
      ? `${where} ${issue.message}`
      : `${where} ${String(field)}: ${issue.message}`;
  }
  return issue.path.length > 0
    ? `${issue.path.join('.')}: ${issue.message}`
    : issue.message;
}

const stripFence = (text: string) =>
  text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

const compact = <T extends object>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== null && v !== undefined),
  );

export function parseQuizJson(
  text: string,
  settings: ImportSettings,
): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(stripFence(text));
  } catch (error) {
    return {
      ok: false,
      error: `The text is not valid JSON: ${(error as Error).message}`,
    };
  }

  const parsed = quizSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: describeIssue(parsed.error.issues[0]) };
  }

  const raw = parsed.data;
  const questions = raw.questions.map(
    (q, index) =>
      compact({
        ...q,
        id: q.id?.trim() || `q${index + 1}`,
        number: q.number ?? index + 1,
        page: index + 1,
        points: q.points ?? 1,
      }) as unknown as Question,
  );

  return {
    ok: true,
    quiz: {
      id: raw.id?.trim() || settings.fallbackId,
      title: settings.title?.trim() || raw.title,
      courseCode: raw.courseCode?.trim() || 'GENERAL',
      description: raw.description ?? '',
      templateMode: settings.templateMode,
      timeLimitMinutes: settings.timeLimitMinutes,
      questionsPerPage: 1,
      antiCheat: settings.antiCheat,
      questions,
    },
  };
}
