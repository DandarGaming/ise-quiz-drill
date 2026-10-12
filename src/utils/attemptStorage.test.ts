import { beforeEach, describe, it, expect } from 'vitest';
import {
  attemptKey,
  HISTORY_KEY,
  loadAttempt,
  saveAttempt,
  clearAttempt,
  loadHistory,
  appendHistory,
} from './attemptStorage';
import type { AttemptState, QuizAttemptRecord } from '../types/quiz';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const attempt: AttemptState = {
  quizId: 'quiz-1',
  startedAt: '2026-10-12T09:00:00.000Z',
  deadline: Date.parse('2026-10-12T09:15:00.000Z'),
  currentPage: 2,
  answers: { q1: 'a', q2: ['a', 'c'] },
  flagged: { q2: true },
  eventLog: [],
};

const record = (id: string): QuizAttemptRecord => ({
  id,
  quizId: 'quiz-1',
  quizTitle: 'Quiz',
  courseCode: 'CS0000',
  timestamp: '2026-10-12T09:10:00.000Z',
  earnedScore: 1,
  totalPoints: 2,
  percentage: 50,
  timeTakenSeconds: 600,
  eventLog: [],
  answers: {},
  quizSnapshot: {
    id: 'quiz-1',
    title: 'Quiz',
    courseCode: 'CS0000',
    description: '',
    templateMode: 'paginated',
    timeLimitMinutes: 15,
    questionsPerPage: 1,
    questions: [],
  },
});

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});

describe('attempt storage', () => {
  it('uses versioned keys', () => {
    expect(attemptKey('quiz-1')).toBe('quiz-drill:v1:attempt:quiz-1');
    expect(HISTORY_KEY).toBe('quiz-drill:v1:history');
  });

  it('saves and restores an attempt', () => {
    saveAttempt(storage, attempt);
    expect(loadAttempt(storage, 'quiz-1')).toEqual(attempt);
  });

  it('returns null when nothing is saved', () => {
    expect(loadAttempt(storage, 'quiz-1')).toBeNull();
  });

  it('ignores corrupt or foreign data instead of crashing', () => {
    storage.setItem(attemptKey('quiz-1'), '{not json');
    expect(loadAttempt(storage, 'quiz-1')).toBeNull();

    storage.setItem(attemptKey('quiz-1'), JSON.stringify({ answers: {} }));
    expect(loadAttempt(storage, 'quiz-1')).toBeNull();

    saveAttempt(storage, { ...attempt, quizId: 'other' });
    storage.setItem(
      attemptKey('quiz-1'),
      storage.getItem(attemptKey('other')) ?? '',
    );
    expect(loadAttempt(storage, 'quiz-1')).toBeNull();
  });

  it('clears a saved attempt', () => {
    saveAttempt(storage, attempt);
    clearAttempt(storage, 'quiz-1');
    expect(loadAttempt(storage, 'quiz-1')).toBeNull();
  });
});

describe('attempt history', () => {
  it('starts empty and keeps the newest attempt first', () => {
    expect(loadHistory(storage)).toEqual([]);

    appendHistory(storage, record('first'));
    appendHistory(storage, record('second'));

    expect(loadHistory(storage).map((r) => r.id)).toEqual(['second', 'first']);
  });

  it('treats corrupt history as empty', () => {
    storage.setItem(HISTORY_KEY, '"oops"');
    expect(loadHistory(storage)).toEqual([]);
  });
});
