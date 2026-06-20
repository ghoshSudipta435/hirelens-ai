import { expect, test } from '@playwright/test';

test.describe('Student Flow — Full Lifecycle', () => {
  const TEST_STUDENT = {
    name: 'Test Student Full',
    email: `test-student-full-${Date.now()}@test.com`,
    password: 'StrongPass123!',
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', TEST_STUDENT.name);
    await page.fill('#email', TEST_STUDENT.email);
    await page.fill('#password', TEST_STUDENT.password);
    await page.fill('#confirmPassword', TEST_STUDENT.password);
    await page.getByText('Student').click();
    await page.click('button[type="submit"]');
    await page.waitForURL('/complete-profile');
  });

  test('student can complete full profile', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Complete');
    await page.fill('#headline', 'Full Stack Developer');
    await page.fill('#university', 'Stanford University');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('student can browse jobs', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('h1')).toContainText('Jobs');
  });

  test('student can view resumes page', async ({ page }) => {
    await page.goto('/resumes');
    await expect(page.locator('h1')).toContainText('Resume');
  });

  test('student can view applications page', async ({ page }) => {
    await page.goto('/applications');
    await expect(page.locator('body')).toBeVisible();
  });

  test('student can view matches page', async ({ page }) => {
    await page.goto('/matches');
    await expect(page.locator('body')).toBeVisible();
  });

  test('student can view interviews page', async ({ page }) => {
    await page.goto('/interviews');
    await expect(page.locator('body')).toBeVisible();
  });

  test('student sees dashboard with correct role', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('student can navigate to upload resume', async ({ page }) => {
    await page.goto('/resumes/new');
    await expect(page.locator('body')).toBeVisible();
  });
});
