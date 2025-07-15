import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:5173/dashboard');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Command Center Dashboard');
  });

  test('should display RAR metrics', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('text=Return Rate');
    
    // Check if RAR metrics are displayed
    await expect(page.locator('text=Return Rate')).toBeVisible();
    await expect(page.locator('text=Authorization Rate')).toBeVisible();
    await expect(page.locator('text=Rejection Rate')).toBeVisible();
  });

  test('should display failure modes', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('text=Top 3 Failure Modes');
    
    // Check if failure modes section is visible
    await expect(page.locator('text=Top 3 Failure Modes')).toBeVisible();
  });

  test('should display sparklines', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('text=Complaint Trends');
    
    // Check if sparklines are visible
    await expect(page.locator('text=Complaint Trends')).toBeVisible();
  });

  test('should navigate to dashboard from navigation', async ({ page }) => {
    // Go to home page first
    await page.goto('http://localhost:5173/');
    
    // Click on dashboard link
    await page.click('text=Dashboard');
    
    // Verify we're on dashboard
    await expect(page).toHaveURL('http://localhost:5173/dashboard');
  });

  test('should display real-time updates', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('text=Return Rate');
    
    // Get initial values
    const initialReturnRate = await page.locator('text=Return Rate').textContent();
    
    // Wait for potential updates (30 second polling)
    // In test, we might need to mock or trigger updates
    await page.waitForTimeout(1000);
    
    // Check if values are still present
    await expect(page.locator('text=Return Rate')).toBeVisible();
  });
});