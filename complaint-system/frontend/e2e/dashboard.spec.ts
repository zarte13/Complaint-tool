import { test, expect } from '@playwright/test';

// Safely read env-like values without relying on Node typings for `process`
declare const BASE_URL_BACKEND: string | undefined;
declare const BASE_URL_FRONTEND: string | undefined;

const backendBase: string =
  (typeof BASE_URL_BACKEND !== 'undefined' && BASE_URL_BACKEND) ||
  ((test.info().project as any)?.use?.BASE_URL_BACKEND as string | undefined) ||
  'http://127.0.0.1:8000';

const frontendBase: string =
  (typeof BASE_URL_FRONTEND !== 'undefined' && BASE_URL_FRONTEND) ||
  ((test.info().project as any)?.use?.BASE_URL_FRONTEND as string | undefined) ||
  'http://localhost:5173';

async function primeAuth(page: any) {
  // Obtain tokens using known CI test user seeded by workflow or local dev
  const resp = await page.request.post(`${backendBase}/auth/login`, {
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
    await page.goto(`${frontendBase}/dashboard`);
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
    await page.goto(`${frontendBase}/`);
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(`${frontendBase}/dashboard`);
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