import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const quizJson = readFileSync('e2e/fixtures/quiz.json', 'utf8');

async function importQuiz(page: Page, title = 'Browser quiz') {
  await page.goto('/');
  await page.getByLabel(/Test Title/).fill(title);
  await page.getByLabel('Quiz JSON').fill(quizJson);
  await page.getByRole('button', { name: 'Start Quiz Simulation Now' }).click();
}

const nextPage = (page: Page) =>
  page.getByRole('button', { name: 'Next Page' }).first().click();

test('opens on the creator', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Quiz Drill');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Mock Test Creator' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Start Quiz Simulation Now' }),
  ).toHaveCount(0);
});

test('takes a quiz and finds the result in the history', async ({ page }) => {
  await importQuiz(page);

  await expect(page.getByRole('timer')).toContainText('remaining');
  await page.getByText('git branch', { exact: true }).click();
  await nextPage(page);
  await page.getByText('True', { exact: true }).click();
  await nextPage(page);
  await page.getByLabel('Answer', { exact: true }).fill('CloudFront');
  await expect(page.getByText('3 of 3 questions saved')).toBeVisible();

  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Submit Quiz' })
    .click();
  await expect(
    page.getByRole('region', { name: 'Quiz Submission Overview' }),
  ).toContainText('3 / 3 (100%)');

  await page.getByRole('button', { name: 'Back to Creator' }).first().click();
  await page.getByRole('button', { name: /Saved Library/ }).click();
  await page.getByRole('tab', { name: /Attempt History \(1\)/ }).click();
  await expect(page.getByText('Browser quiz').first()).toBeVisible();
});

test('scores a quiz with wrong answers', async ({ page }) => {
  await importQuiz(page);

  await page.getByText('git merge', { exact: true }).click();
  await page.getByRole('button', { name: 'Submit Quiz' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Submit Quiz' })
    .click();

  await expect(
    page.getByRole('region', { name: 'Quiz Submission Overview' }),
  ).toContainText('0 / 3 (0%)');
});

test('keeps the quiz in the saved library after a reload', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await importQuiz(page, 'Kept quiz');
  await page.getByRole('button', { name: 'Exit quiz' }).click();

  await page.reload();
  const library = page.getByRole('button', { name: /Saved Library/ });
  await expect(library).toContainText('1');
  await library.click();

  await expect(page.getByText('Kept quiz')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Quiz' })).toBeVisible();
});

test('explains a broken JSON', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Quiz JSON').fill('{"title": "Oops",');

  await expect(page.getByRole('alert')).toContainText('not valid JSON');
  await expect(
    page.getByRole('button', { name: 'Start Quiz Simulation Now' }),
  ).toHaveCount(0);
});

test('serves a health check for the container', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.ok()).toBe(true);
});

test('keeps the quiz visible when answering a lower question in scroll mode', async ({
  page,
}) => {
  const long = JSON.parse(quizJson);
  long.questions = Array.from({ length: 12 }, (_, i) => ({
    ...long.questions[0],
    id: `q${i + 1}`,
    number: i + 1,
    prompt: `Question text ${i + 1}?`,
  }));
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Scroll Form (All Questions)' })
    .click();
  await page.getByLabel(/Test Title/).fill('Scroll quiz');
  await page.getByLabel('Quiz JSON').fill(JSON.stringify(long));
  await page.getByRole('button', { name: 'Start Quiz Simulation Now' }).click();

  const question = page.getByRole('group', { name: 'Question 8' });
  await question.scrollIntoViewIfNeeded();
  await question.getByText('git branch', { exact: true }).click();

  await expect(page.getByRole('timer')).toBeInViewport();
  await expect(
    question.getByText('git branch', { exact: true }),
  ).toBeInViewport();
});
