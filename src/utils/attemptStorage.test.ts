import { beforeEach, describe, it, expect } from 'vitest';
import {
  HISTORY_KEY,
  loadHistory,
  appendHistory,
  deleteHistoryRecord,
  clearHistory,
  QUIZZES_KEY,
  loadSavedQuizzes,
  saveQuiz,
  deleteSavedQuiz,
} from './attemptStorage';
import { sampleQuiz } from '../data/sampleQuiz';
import type { QuizAttemptRecord } from '../types/quiz';

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
  quizSnapshot: sampleQuiz,
});

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});

describe('storage keys', () => {
  it('are versioned', () => {
    expect(HISTORY_KEY).toBe('quiz-drill:v1:history');
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

  it('skips broken records and keeps the good ones', () => {
    storage.setItem(
      HISTORY_KEY,
      JSON.stringify([record('good'), { id: 'broken' }, null]),
    );
    expect(loadHistory(storage).map((r) => r.id)).toEqual(['good']);
  });

  it('deletes one record or clears them all', () => {
    appendHistory(storage, record('first'));
    appendHistory(storage, record('second'));

    deleteHistoryRecord(storage, 'first');
    expect(loadHistory(storage).map((r) => r.id)).toEqual(['second']);

    clearHistory(storage);
    expect(loadHistory(storage)).toEqual([]);
  });
});

describe('saved quizzes', () => {
  const other = { ...sampleQuiz, id: 'other', title: 'Other' };

  it('uses a versioned key and starts empty', () => {
    expect(QUIZZES_KEY).toBe('quiz-drill:v1:quizzes');
    expect(loadSavedQuizzes(storage)).toEqual([]);
  });

  it('keeps the latest saved quiz first and replaces one with the same id', () => {
    saveQuiz(storage, sampleQuiz);
    saveQuiz(storage, other);
    saveQuiz(storage, { ...sampleQuiz, title: 'Renamed' });

    expect(loadSavedQuizzes(storage).map((q) => q.title)).toEqual([
      'Renamed',
      'Other',
    ]);
  });

  it('deletes a saved quiz', () => {
    saveQuiz(storage, sampleQuiz);
    deleteSavedQuiz(storage, sampleQuiz.id);
    expect(loadSavedQuizzes(storage)).toEqual([]);
  });

  it('skips saved quizzes that fail validation', () => {
    storage.setItem(
      QUIZZES_KEY,
      JSON.stringify([sampleQuiz, { ...other, questions: [] }, 'junk']),
    );
    expect(loadSavedQuizzes(storage).map((q) => q.id)).toEqual([sampleQuiz.id]);
  });
});
