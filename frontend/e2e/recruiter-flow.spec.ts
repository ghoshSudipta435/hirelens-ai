import { expect, test } from '@playwright/test';

test.describe('Recruiter Flow', () => {
  test('recruiter can register and create a job', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Test Recruiter');
    await page.fill('#email', `test-recruiter-${Date.now()}@test.com`);
    await page.fill('#password', 'StrongPass123!');
    await page.fill('#confirmPassword', 'StrongPass123!');
    await page.getByText('Recruiter').click();
    await page.click('button[type="submit"]');
    await page.waitForURL('/complete-profile');

    await page.fill('#companyName', 'Test Corp');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/jobs/new');
    await page.fill('#title', 'Senior Engineer');
    await page.fill('#description', 'We need an experienced engineer');
    await page.click('button[type="submit"]');
    await page.waitForURL('/jobs');
    await expect(page.getByText('Senior Engineer')).toBeVisible();
  });

  test('recruiter sees empty jobs state', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#name', 'Recruiter Empty');
    await page.fill('#email', `recruiter-empty-${Date.now()}@test.com`);
    await page.fill('#password', 'StrongPass123!');
    await page.fill('#confirmPassword', 'StrongPass123!');
    await page.getByText('Recruiter').click();
    await page.click('button[type="submit"]');
    await page.waitForURL('/complete-profile');

    await page.fill('#companyName', 'Empty Corp');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto('/jobs');
    await expect(page.getByText('No job postings yet')).toBeVisible();
  });
});
