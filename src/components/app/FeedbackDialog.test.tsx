// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackDialog } from './FeedbackDialog';

afterEach(() => vi.unstubAllGlobals());

describe('FeedbackDialog', () => {
  it('explains why Send is disabled for an empty message', () => {
    render(<FeedbackDialog onClose={() => {}} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(
      screen.getByText('Write a message before sending.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/private server logs for up to 30 days/),
    ).toBeInTheDocument();
  });

  it('disables Send and explains the message limit', () => {
    render(<FeedbackDialog onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'x'.repeat(2001) },
    });

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(
      screen.getByText('Keep your message to 2000 characters or fewer.'),
    ).toBeInTheDocument();
  });

  it('sends the message with question context and thanks the user', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    render(
      <FeedbackDialog
        context={{ quizTitle: 'Cloud basics', questionNumber: 4 }}
        onClose={() => {}}
      />,
    );

    await userEvent.type(
      screen.getByLabelText('Message'),
      'Answer seems wrong.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(fetch).toHaveBeenCalledWith(
      '/api/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          category: 'wrong_question',
          message: 'Answer seems wrong.',
          quizTitle: 'Cloud basics',
          questionNumber: 4,
        }),
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Thank you — your feedback was sent to the project owner.',
    );
  });

  it('explains when the server refuses a message due to its rate limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 429 })),
    );
    render(<FeedbackDialog onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText('Message'), 'Too many reports?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The feedback limit has been reached.',
    );
  });
});
