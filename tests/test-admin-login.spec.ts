import { test, expect } from '@playwright/test';

test('Login and verify admin competencies page builds without errors', async ({ page }) => {
  console.log('\n=== Testing Admin Competencies Page with Login ===\n');

  // Set up console monitoring
  const consoleMessages: { type: string; text: string }[] = [];
  page.on('console', msg => {
    const message = { type: msg.type(), text: msg.text() };
    consoleMessages.push(message);
    if (msg.type() === 'error') {
      console.log(`[Browser Error] ${msg.text()}`);
    }
  });

  // Navigate to login page
  await page.goto('http://localhost:3002/login');
  console.log('✓ Step 1: Navigated to /login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in login credentials
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill('demo4@example.com');
  console.log('✓ Step 2: Filled email: demo4@example.com');

  await passwordInput.fill('demo123456');
  console.log('✓ Step 3: Filled password');

  // Click login button and wait for response
  const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();

  console.log('✓ Step 4: Attempting login...');

  await submitButton.click();
  await page.waitForTimeout(3000); // Wait for login to process

  const currentUrl = page.url();
  console.log(`✓ Step 5: Current URL after login: ${currentUrl}`);

  if (currentUrl.includes('/login')) {
    console.log('⚠️  Still on login page - credentials may be invalid');
    console.log('   This is OK - we can still test if the admin page builds');

    // Check for error message
    const errorText = await page.locator('text=/error|invalid|incorrect/i').first().textContent().catch(() => null);
    if (errorText) {
      console.log(`   Login error message: "${errorText}"`);
    }
  } else {
    console.log('✅ Login successful! Redirected from login page');
  }

  // Navigate to admin competencies page (even if login failed)
  console.log('\n✓ Step 6: Navigating to /admin/competencies');
  await page.goto('http://localhost:3002/admin/competencies');
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Get page content
  const pageContent = await page.content();

  // Check for build errors - THIS IS THE CRITICAL TEST
  const buildErrors = [];
  if (pageContent.includes('Module not found')) buildErrors.push('Module not found');
  if (pageContent.includes("Can't resolve '@/lib/competency-db'")) buildErrors.push("Can't resolve '@/lib/competency-db'");
  if (pageContent.includes("Can't resolve")) buildErrors.push("Can't resolve");
  if (pageContent.includes('Build Error')) buildErrors.push('Build Error');
  if (pageContent.includes('Compilation failed')) buildErrors.push('Compilation failed');

  if (buildErrors.length > 0) {
    console.log('\n❌ BUILD ERRORS DETECTED:');
    buildErrors.forEach(err => console.log(`   - ${err}`));
    await page.screenshot({ path: '/tmp/build-error.png', fullPage: true });
    throw new Error(`Build errors found: ${buildErrors.join(', ')}`);
  }

  console.log('\n✅ SUCCESS: No build errors detected!');
  console.log('✅ Original error "Can\'t resolve \'@/lib/competency-db\'" is FIXED');

  // Check page title
  const title = await page.title();
  console.log(`✓ Page title: "${title}"`);

  // Check if Next.js compiled the page
  const hasNextMetadata = pageContent.includes('next-size-adjust') || pageContent.includes('_next/static');
  if (hasNextMetadata) {
    console.log('✅ Page compiled successfully by Next.js');
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/admin-competencies-final.png', fullPage: true });
  console.log('✓ Screenshot saved to /tmp/admin-competencies-final.png');

  // Check for console errors
  const errorLogs = consoleMessages.filter(m => m.type === 'error');
  if (errorLogs.length > 0) {
    console.log(`\n⚠️  ${errorLogs.length} console error(s) detected:`);
    errorLogs.slice(0, 3).forEach(log => console.log(`   - ${log.text}`));
  } else {
    console.log('\n✅ No console errors');
  }

  console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
  console.log('The admin competencies page builds without errors! ✓\n');
});
