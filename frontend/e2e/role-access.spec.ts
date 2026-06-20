import { expect, test } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  async function registerAs(page: any, role: string) {
    await page.goto('/register');
    await page.fill('#name', `Test ${role}`);
    await page.fill('#email', `test-${role.toLowerCase()}-${Date.now()}@test.com`);
    await page.fill('#password', 'StrongPass123!');
    await page.fill('#confirmPassword', 'StrongPass123!');
    await page.getByText(role === 'STUDENT' ? 'Student' : 'Recruiter').click();
    await page.click('button[type="submit"]');
    await page.waitForURL('/complete-profile');
    if (role === 'RECRUITER') {
      await page.fill('#companyName', 'Test Corp');
    } else {
      await page.fill('#headline', 'Engineer');
      await page.fill('#university', 'MIT');
    }
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  }

  test('student cannot access recruiter-specific pages', async ({ page }) => {
    await registerAs(page, 'STUDENT');
    await page.goto('/jobs/new');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('recruiter can access job creation page', async ({ page }) => {
    await registerAs(page, 'RECRUITER');
    await page.goto('/jobs/new');
    await expect(page.locator('h1')).toContainText('New Job');
  });
});
