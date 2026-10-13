import type { QuizAttemptRecord, QuizConfig } from '../types/quiz';
import { isAttemptRecord, isStoredQuiz } from './quizSchema';

// Bump the version when the stored shape changes, so old data is ignored
// instead of being read with the wrong shape.
const PREFIX = 'quiz-drill:v1';

export const HISTORY_KEY = `${PREFIX}:history`;
export const QUIZZES_KEY = `${PREFIX}:quizzes`;

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function readJson(storage: KeyValueStore, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

// Broken entries are skipped one by one, so one bad record does not hide
// the rest of the list
function readList<T>(
  storage: KeyValueStore,
  key: string,
  isValid: (value: unknown) => value is T,
): T[] {
  const value = readJson(storage, key);
  return Array.isArray(value) ? value.filter(isValid) : [];
}

export function loadHistory(storage: KeyValueStore): QuizAttemptRecord[] {
  return readList(storage, HISTORY_KEY, isAttemptRecord);
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

export function deleteHistoryRecord(storage: KeyValueStore, id: string) {
  storage.setItem(
    HISTORY_KEY,
    JSON.stringify(loadHistory(storage).filter((r) => r.id !== id)),
  );
}

export function clearHistory(storage: KeyValueStore) {
  storage.removeItem(HISTORY_KEY);
}

export function loadSavedQuizzes(storage: KeyValueStore): QuizConfig[] {
  return readList(storage, QUIZZES_KEY, isStoredQuiz);
}

// Saving again replaces the quiz with the same id and moves it to the top
export function saveQuiz(storage: KeyValueStore, quiz: QuizConfig) {
  const others = loadSavedQuizzes(storage).filter((q) => q.id !== quiz.id);
  storage.setItem(QUIZZES_KEY, JSON.stringify([quiz, ...others]));
}

export function deleteSavedQuiz(storage: KeyValueStore, id: string) {
  storage.setItem(
    QUIZZES_KEY,
    JSON.stringify(loadSavedQuizzes(storage).filter((q) => q.id !== id)),
  );
}
