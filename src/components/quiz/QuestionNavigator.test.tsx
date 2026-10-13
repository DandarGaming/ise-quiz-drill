// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionNavigator } from './QuestionNavigator';
import type { Question } from '../../types/quiz';

const question = (number: number, page: number): Question => ({
  id: `q${number}`,
  number,
  page,
  type: 'mcq',
  points: 1,
  prompt: `Prompt ${number}`,
  correctAnswer: 'a',
});

const questions = [question(1, 1), question(2, 1), question(3, 2)];

const renderNavigator = (onSelect = vi.fn()) =>
  render(
    <QuestionNavigator
      questions={questions}
      currentPage={2}
      answers={{ q1: 'a', q2: '' }}
      flagged={{ q2: true }}
      onSelect={onSelect}
    />,
  );

describe('QuestionNavigator', () => {
  it('is separated from the quiz by a thin line', () => {
    renderNavigator();
    expect(screen.getByRole('navigation', { name: 'Questions' })).toHaveClass(
      'border-r',
    );
  });

  it('groups the questions by page', () => {
    renderNavigator();
    const nav = screen.getByRole('navigation', { name: 'Questions' });

    expect(
      within(nav)
        .getAllByRole('heading')
        .map((h) => h.textContent),
    ).toEqual(['Page 1:', 'Page 2:']);
  });

  it('names each button with its number and state', () => {
    renderNavigator();

    expect(
      screen.getByRole('button', { name: 'Question 1, answered' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Question 2, flagged' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Question 3' }),
    ).toBeInTheDocument();
  });

  it('marks the questions on the current page', () => {
    renderNavigator();

    expect(screen.getByRole('button', { name: 'Question 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Question 1, answered' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('reports the chosen question', async () => {
    const onSelect = vi.fn();
    renderNavigator(onSelect);

    await userEvent.click(screen.getByRole('button', { name: /^Question 2/ }));

    expect(onSelect).toHaveBeenCalledWith(questions[1]);
  });
});
