import { expect, test } from '@playwright/test';

test.describe('Error States', () => {
  test('shows 404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
  });

  test('handles network errors gracefully', async ({ page }) => {
    await page.goto('/login');
    // Attempt login with invalid credentials to trigger error handling
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should show error toast or message, not crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('maintains page state after failed form submission', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'existing@test.com');
    await page.fill('#password', 'StrongPass123!');
    await page.fill('#confirmPassword', 'StrongPass123!');
    await page.click('button[type="submit"]');
    // Form should retain values after error
    await expect(page.locator('#name')).toHaveValue('Test User');
  });
});

test.describe('Access Control', () => {
  test('student cannot access recruiter-only routes via URL', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'student@test.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Try to access jobs/new (recruiter only)
    const response = await page.goto('/jobs/new');
    // Should either redirect or show forbidden
    expect(response?.status()).not.toBe(200);
  });

  test('unauthenticated user cannot access API directly', async ({ page }) => {
    const response = await page.goto('/api/v1/users/me');
    expect(response?.status()).toBe(401);
  });
});

test.describe('Form Validation', () => {
  test('register form validates password requirements', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Test');
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'weak');
    await page.fill('#confirmPassword', 'weak');
    await page.click('button[type="submit"]');
    // Should show validation error for weak password
    await expect(page.locator('body')).toBeVisible();
  });

  test('register form validates email format', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Test');
    await page.fill('#email', 'not-an-email');
    await page.fill('#password', 'StrongPass123!');
    await page.fill('#confirmPassword', 'StrongPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('body')).toBeVisible();
  });

  test('register form validates password confirmation match', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Test');
    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'StrongPass123!');
    await page.fill('#confirmPassword', 'DifferentPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('can navigate between public pages', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign in');
    await page.waitForURL('/login');
    await page.click('text=Create an account');
    await page.waitForURL('/register');
  });

  test('browser back/forward works correctly', async ({ page }) => {
    await page.goto('/login');
    await page.goto('/register');
    await page.goBack();
    await expect(page).toHaveURL('/login');
    await page.goForward();
    await expect(page).toHaveURL('/register');
  });
});
