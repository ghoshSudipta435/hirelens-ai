import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate as student', async ({ page }) => {
  await page.goto('/register');
  await page.fill('#name', 'E2E Student');
  await page.fill('#email', `e2e-student-${Date.now()}@test.com`);
  await page.fill('#password', 'StrongPass123!');
  await page.fill('#confirmPassword', 'StrongPass123!');
  await page.click('text=Student');
  await page.click('button[type="submit"]');
  await page.waitForURL('/complete-profile');
  await page.context().storageState({ path: authFile });
});
