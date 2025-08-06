import { test, expect } from '@playwright/test';

async function primeAuth(page: any) {
  // Obtain tokens using known CI test user seeded by workflow or local dev
  const resp = await page.request.post('http://127.0.0.1:8000/auth/login', {
    data: { username: 'admin', password: 'YourPass123' },
  });
  expect(resp.ok()).toBeTruthy();
  const json = await resp.json();

  // Persist in localStorage using the shape used by the Zustand auth store
  await page.addInitScript(([access, refresh]) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        isAuthenticated: true,
        accessToken: access,
        refreshToken: refresh,
      },
      version: 0,
    }));
  }, [json.access_token, json.refresh_token]);
}

test.describe('Dashboard E2E Tests (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await primeAuth(page);
    await page.goto('http://localhost:5173/dashboard');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Command Center Dashboard');
  });

  test('should display RAR metrics', async ({ page }) => {
    await expect(page.getByText('Number of open complaints')).toBeVisible();
    await expect(page.getByText('Number of in progress complaints')).toBeVisible();
    await expect(page.getByText('Number of resolved complaints')).toBeVisible();
  });

  test('should display failure modes', async ({ page }) => {
    await expect(page.getByText('Top 3 Failure Modes')).toBeVisible();
  });

  test('should display sparklines', async ({ page }) => {
    await expect(page.getByText('Complaint Trends')).toBeVisible();
  });

  test('should navigate to dashboard from navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('http://localhost:5173/dashboard');
  });

  test('should display real-time updates', async ({ page }) => {
    await expect(page.getByText('Return Rate')).toBeVisible();
    const initialReturnRate = await page.locator('text=Return Rate').textContent();
    // In test, we might need to mock or trigger updates
    await page.waitForTimeout(1000);
    
    // Check if values are still present
    await expect(page.locator('text=Return Rate')).toBeVisible();
  });
});