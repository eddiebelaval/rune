import { expect, test } from '@playwright/test';

test('landing page renders Rune marketing copy', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Rune/i);
  await expect(page.getByRole('heading', { name: /Speak your book into existence/i })).toBeVisible();
});

test('protected settings route redirects unauthenticated users to auth', async ({ page }) => {
  await page.goto('/settings');

  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByText(/Welcome to Rune/i)).toBeVisible();
});

test('protected API rejects unauthenticated users', async ({ request }) => {
  const response = await request.get('/api/books');
  expect(response.status()).toBe(401);
});

test('knowledge graph API rejects unauthenticated users', async ({ request }) => {
  const response = await request.get('/api/knowledge-graph?bookId=00000000-0000-0000-0000-000000000000');
  expect(response.status()).toBe(401);
});
