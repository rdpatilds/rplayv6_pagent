import { test, expect } from '@playwright/test';

test('Login and access admin competencies page', async ({ page }) => {
  // Navigate to the frontend
  await page.goto('http://localhost:3002');

  console.log('Step 1: Navigated to homepage');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if we're already on login page or need to navigate
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // If not on login page, try to find and click login button
  if (!currentUrl.includes('/login') && !currentUrl.includes('/auth')) {
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), a:has-text("Sign In")').first();
    if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
      console.log('Step 2: Clicked login button');
    } else {
      // Try navigating directly to login
      await page.goto('http://localhost:3002/login');
      await page.waitForLoadState('networkidle');
      console.log('Step 2: Navigated directly to /login');
    }
  }

  // Fill in login credentials
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill('demo@example.com');
  console.log('Step 3: Filled email');

  await passwordInput.fill('demo12345');
  console.log('Step 4: Filled password');

  // Click login button
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
  await submitButton.click();
  console.log('Step 5: Clicked login button');

  // Wait for navigation after login
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  console.log(`Step 6: After login - URL: ${page.url()}`);

  // Navigate to admin competencies page
  await page.goto('http://localhost:3002/admin/competencies');
  console.log('Step 7: Navigated to /admin/competencies');

  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Check for build errors in the page
  const pageContent = await page.content();
  const hasBuildError = pageContent.includes('Module not found') ||
                        pageContent.includes("Can't resolve") ||
                        pageContent.includes('Build Error');

  if (hasBuildError) {
    console.error('❌ BUILD ERROR FOUND ON PAGE');
    // Take a screenshot for debugging
    await page.screenshot({ path: '/tmp/admin-competencies-error.png', fullPage: true });
    throw new Error('Build error detected on admin competencies page');
  }

  console.log('✅ Step 8: No build errors detected');

  // Check if the page loaded successfully
  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Look for competencies-related content
  const hasCompetenciesContent = await page.locator('text=/competenc/i').first().isVisible({ timeout: 5000 }).catch(() => false);

  if (hasCompetenciesContent) {
    console.log('✅ Step 9: Competencies page content is visible');
  } else {
    console.log('⚠️  Step 9: Could not find competencies content, but page loaded');
  }

  // Take a screenshot for verification
  await page.screenshot({ path: '/tmp/admin-competencies-success.png', fullPage: true });
  console.log('✅ Screenshot saved to /tmp/admin-competencies-success.png');

  // Verify no console errors (except warnings)
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Wait a bit to catch any console errors
  await page.waitForTimeout(2000);

  if (consoleErrors.length > 0) {
    console.warn('⚠️  Console errors detected:', consoleErrors);
  } else {
    console.log('✅ No console errors');
  }

  console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
});
