import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Invalid email')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'nonexistent@test.com');
    await page.fill('#password', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Login failed')).toBeVisible();
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/login');
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('can navigate to register from login', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Create an account');
    await page.waitForURL('/register');
    await expect(page.locator('h1')).toContainText('Create');
  });
});
