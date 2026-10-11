// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubmitModal } from './SubmitModal';
import type { Question } from '../../types/quiz';

const question = (number: number): Question => ({
  id: `q${number}`,
  number,
  page: number,
  type: 'mcq',
  points: 1,
  prompt: `Prompt ${number}`,
  correctAnswer: 'a',
});

const questions = [question(1), question(2), question(3)];

function Harness({
  answers = {},
  onConfirm = () => {},
}: {
  answers?: Record<string, string>;
  onConfirm?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Submit Quiz
      </button>
      <SubmitModal
        isOpen={open}
        questions={questions}
        answers={answers}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

const open = () =>
  userEvent.click(screen.getByRole('button', { name: 'Submit Quiz' }));

describe('SubmitModal', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a labelled modal dialog', async () => {
    render(<Harness />);
    await open();

    const dialog = screen.getByRole('dialog', {
      name: 'Submit quiz confirmation',
    });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('Submitting will end your attempt');
  });

  it('lists the unanswered questions', async () => {
    render(<Harness answers={{ q2: 'a' }} />);
    await open();

    expect(screen.getByRole('dialog')).toHaveTextContent('Unanswered: Q1, Q3');
  });

  it('says when every question is answered', async () => {
    render(<Harness answers={{ q1: 'a', q2: 'a', q3: 'a' }} />);
    await open();

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'All questions have been answered.',
    );
  });

  it('moves focus to Back to Quiz and keeps it inside the dialog', async () => {
    render(<Harness />);
    await open();

    const back = screen.getByRole('button', { name: 'Back to Quiz' });
    const submit = screen.getAllByRole('button', { name: 'Submit Quiz' })[1];
    expect(back).toHaveFocus();

    await userEvent.tab();
    expect(submit).toHaveFocus();
    await userEvent.tab();
    expect(back).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(submit).toHaveFocus();
  });

  it('closes on Escape and returns focus to the button that opened it', async () => {
    render(<Harness />);
    await open();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Quiz' })).toHaveFocus();
  });

  it('confirms the submission', async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    await open();

    await userEvent.click(
      screen.getAllByRole('button', { name: 'Submit Quiz' })[1],
    );

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
