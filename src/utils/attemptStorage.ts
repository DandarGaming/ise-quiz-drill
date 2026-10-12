import type { AttemptState, QuizAttemptRecord } from '../types/quiz';

// Bump the version when the stored shape changes, so old data is ignored
// instead of being read with the wrong shape.
const PREFIX = 'quiz-drill:v1';

export const attemptKey = (quizId: string) => `${PREFIX}:attempt:${quizId}`;
export const HISTORY_KEY = `${PREFIX}:history`;

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function readJson(storage: KeyValueStore, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isAttempt(value: unknown, quizId: string): value is AttemptState {
  return (
    isRecord(value) &&
    value.quizId === quizId &&
    typeof value.startedAt === 'string' &&
    typeof value.deadline === 'number' &&
    typeof value.currentPage === 'number' &&
    isRecord(value.answers) &&
    isRecord(value.flagged) &&
    Array.isArray(value.eventLog)
  );
}

export function loadAttempt(
  storage: KeyValueStore,
  quizId: string,
): AttemptState | null {
  const value = readJson(storage, attemptKey(quizId));
  return isAttempt(value, quizId) ? value : null;
}

export function saveAttempt(storage: KeyValueStore, attempt: AttemptState) {
  storage.setItem(attemptKey(attempt.quizId), JSON.stringify(attempt));
}

export function clearAttempt(storage: KeyValueStore, quizId: string) {
  storage.removeItem(attemptKey(quizId));
}

export function loadHistory(storage: KeyValueStore): QuizAttemptRecord[] {
  const value = readJson(storage, HISTORY_KEY);
  return Array.isArray(value) ? (value as QuizAttemptRecord[]) : [];
}

export function appendHistory(
  storage: KeyValueStore,
  record: QuizAttemptRecord,
) {
  storage.setItem(
    HISTORY_KEY,
    JSON.stringify([record, ...loadHistory(storage)]),
  );
}
