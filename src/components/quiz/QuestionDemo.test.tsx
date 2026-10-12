// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionDemo } from './QuestionDemo';

describe('QuestionDemo', () => {
  it('renders one question of every type', () => {
    render(<QuestionDemo />);
    expect(
      screen.getAllByRole('heading', { name: /^Question \d/ }),
    ).toHaveLength(5);
    expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    expect(screen.getByRole('textbox', { name: 'Answer' })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Blank 1' }),
    ).toBeInTheDocument();
  });

  it('keeps answers and flags per question', async () => {
    render(<QuestionDemo />);
    const [firstFlag, secondFlag] = screen.getAllByRole('button', {
      name: 'Flag question',
    });

    await userEvent.click(firstFlag);

    expect(firstFlag).toHaveAttribute('aria-pressed', 'true');
    expect(secondFlag).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the header, the navigator and a submit flow', async () => {
    render(<QuestionDemo />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('timer')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Questions' });
    expect(within(nav).getAllByRole('button')).toHaveLength(5);

    await userEvent.click(screen.getByRole('button', { name: 'Submit Quiz' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Unanswered: Q1, Q2, Q3, Q4, Q5',
    );

    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Submit Quiz',
      }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Submitted');
  });
});
