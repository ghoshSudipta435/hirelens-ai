import { expect, test } from '@playwright/test';

test.describe('Accessibility', () => {
  test('skip link is first focusable element', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveText('Skip to main content');
  });

  test('login form has accessible labels', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });

  test('register form has accessible labels', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('label[for="name"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('label[for="confirmPassword"]')).toBeVisible();
  });

  test('navigation has accessible landmarks', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('nav')).toBeAttached();
  });
});
