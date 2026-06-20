import { expect, test } from '@playwright/test';

test.describe('Student Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Test Student');
    await page.fill('#email', `test-student-${Date.now()}@test.com`);
    await page.fill('#password', 'StrongPass123!');
    await page.fill('#confirmPassword', 'StrongPass123!');
    await page.getByText('Student').click();
    await page.click('button[type="submit"]');
    await page.waitForURL('/complete-profile');
  });

  test('student can complete profile', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Complete');
    await page.fill('#headline', 'Software Engineer');
    await page.fill('#university', 'MIT');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('student can browse jobs', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('h1')).toContainText('Jobs');
  });

  test('student sees empty resumes state', async ({ page }) => {
    await page.goto('/resumes');
    await expect(page.getByText('No resumes yet')).toBeVisible();
  });
});
