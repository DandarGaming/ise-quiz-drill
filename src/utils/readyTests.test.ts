import { describe, it, expect } from 'vitest';
import { buildReadyTest, describeReadyTest } from './readyTests';

const json = {
  title: 'Week 6 containers',
  questions: Array.from({ length: 10 }, (_, i) => ({
    type: 'multi-select',
    prompt: `Question ${i + 1}?`,
    options: [
      { id: 'a', text: 'One' },
      { id: 'b', text: 'Two' },
    ],
    correctAnswer: ['a'],
  })),
};

describe('buildReadyTest', () => {
  it('takes the time limit, layout and anti-cheat from the preset', () => {
    const { quiz } = buildReadyTest('devops', json);

    expect(quiz.timeLimitMinutes).toBe(15);
    expect(quiz.templateMode).toBe('paginated');
    expect(quiz.antiCheat).toEqual({
      enabled: true,
      tabLock: true,
      uiRestrictions: true,
      fullscreenLock: true,
    });
    expect(quiz.questions).toHaveLength(10);
  });

  // Like the creator, a preset title wins over the one in the JSON
  it('uses the preset title', () => {
    expect(buildReadyTest('devops', json).quiz.title).toBe('DevOps Quiz');
  });

  // A stable id keeps every attempt of a ready test under one saved quiz
  it('gives the quiz a stable id from the preset', () => {
    const test = buildReadyTest('itg', { ...json, id: 'from-the-ai' });

    expect(test.id).toBe('itg');
    expect(test.quiz.id).toBe('ready-itg');
  });

  it('lists every problem when the JSON is not a valid quiz', () => {
    expect(() =>
      buildReadyTest('devops', { title: 'Broken', questions: [{}] }),
    ).toThrow(/Ready test devops is not a valid quiz: Question 1/);
  });

  it('refuses a preset that does not exist', () => {
    expect(() => buildReadyTest('nope', json)).toThrow(/Unknown preset nope/);
  });
});

describe('describeReadyTest', () => {
  it('sums up the questions, time, layout and proctoring', () => {
    expect(describeReadyTest(buildReadyTest('devops', json))).toBe(
      '10 multi-select · 15 min · paginated · proctored',
    );
  });

  it('says questions when the types are mixed', () => {
    const mixed = {
      ...json,
      questions: [
        json.questions[0],
        {
          type: 'mcq',
          prompt: 'Pick one',
          options: [
            { id: 'a', text: 'One' },
            { id: 'b', text: 'Two' },
          ],
          correctAnswer: 'a',
        },
      ],
    };
    expect(describeReadyTest(buildReadyTest('itg', mixed))).toBe(
      '2 questions · 60 min · one page · proctored',
    );
  });
});
