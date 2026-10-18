import type { APIRoute } from 'astro';
import {
  acceptFeedbackRequest,
  feedbackClientKey,
  MAX_FEEDBACK_LENGTH,
  parseFeedbackPayload,
} from '../../utils/feedback';
import { readCappedText } from '../../utils/requestBody';

export const prerender = false;

const MAX_FEEDBACK_BYTES = MAX_FEEDBACK_LENGTH * 4 + 512;

export const POST: APIRoute = async ({ request }) => {
  const text = await readCappedText(request, MAX_FEEDBACK_BYTES);
  if (text === null) return new Response(null, { status: 413 });

  const feedback = parseFeedbackPayload(text);
  if (!feedback) return new Response(null, { status: 400 });

  const clientKey = feedbackClientKey(
    request.headers.get('x-forwarded-for'),
    request.headers.get('cloudfront-viewer-address'),
  );
  if (!acceptFeedbackRequest(clientKey)) {
    return new Response(null, {
      status: 429,
      headers: { 'retry-after': '3600' },
    });
  }

  console.log(
    JSON.stringify({
      type: 'user_feedback',
      ...feedback,
      timestamp: new Date().toISOString(),
    }),
  );
  return new Response(null, { status: 204 });
};
