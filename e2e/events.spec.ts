import { expect, test } from '@playwright/test';

// The built server must accept the beacon a real browser sends (text/plain,
// same origin) and turn away anything outside the allow-list.

test('the app reports app_opened and the server accepts it', async ({
  page,
}) => {
  const accepted = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/events') &&
      response.request().postData() === '{"event":"app_opened"}',
  );

  await page.goto('/');

  expect((await accepted).status()).toBe(204);
});

test('POST /api/events returns 204 for an allowed event', async ({
  request,
}) => {
  const response = await request.post('/api/events', {
    data: { event: 'quiz_imported', props: { valid: true } },
  });

  expect(response.status()).toBe(204);
});

test('POST /api/events returns 400 for anything else', async ({ request }) => {
  const response = await request.post('/api/events', {
    data: { event: 'quiz_imported', props: { valid: true, title: 'x' } },
  });

  expect(response.status()).toBe(400);
});
