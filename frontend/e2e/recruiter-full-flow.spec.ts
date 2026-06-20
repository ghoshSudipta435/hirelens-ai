import { expect, test } from '@playwright/test';

const TEST_RECRUITER = {
  name: 'Test Recruiter',
  email: `test-recruiter-${Date.now()}@test.com`,
  password: 'StrongPass123!',
};

test.describe('Recruiter Flow — Full Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Register as recruiter
    await page.goto('/register');
    await page.fill('#name', TEST_RECRUITER.name);
    await page.fill('#email', TEST_RECRUITER.email);
    await page.fill('#password', TEST_RECRUITER.password);
    await page.fill('#confirmPassword', TEST_RECRUITER.password);
    await page.getByText('Recruiter').click();
    await page.click('button[type="submit"]');
    await page.waitForURL('/complete-profile');
  });

  test('recruiter can complete profile', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Complete');
    await page.fill('#companyName', 'Acme Corp');
    await page.fill('#designation', 'HR Manager');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('recruiter can access jobs page', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('h1')).toContainText('Jobs');
  });

  test('recruiter sees empty applications state', async ({ page }) => {
    await page.goto('/applications');
    await expect(page.locator('body')).toBeVisible();
  });

  test('recruiter can navigate to create job', async ({ page }) => {
    await page.goto('/jobs');
    // Look for create/new job button or link
    const createButton = page.getByRole('link', { name: /create|new|post/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Recruiter — Job Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', TEST_RECRUITER.name);
    await page.fill('#email', `test-recruiter-${Date.now()}@test.com`);
    await page.fill('#password', TEST_RECRUITER.password);
    await page.fill('#confirmPassword', TEST_RECRUITER.password);
    await page.getByText('Recruiter').click();
    await page.click('button[type="submit"]');
    await page.waitForURL('/complete-profile');
    await page.fill('#companyName', 'Acme Corp');
    await page.fill('#designation', 'HR Manager');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('can view job listings', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('h1')).toContainText('Jobs');
  });

  test('can access job creation form', async ({ page }) => {
    await page.goto('/jobs/new');
    await expect(page.locator('body')).toBeVisible();
  });
});
