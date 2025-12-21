import { test, expect } from '@playwright/test';

test('Verify CSS and styling are restored', async ({ page }) => {
  console.log('=== Testing CSS and Styling Restoration ===');

  // Navigate to login page
  await page.goto('http://localhost:3000/login');
  console.log('✓ Navigated to /login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: '/tmp/login-page-with-css.png', fullPage: true });
  console.log('✓ Screenshot saved to /tmp/login-page-with-css.png');

  // Check if CSS stylesheet is loaded
  const stylesheets = await page.locator('link[rel="stylesheet"]').count();
  console.log(`✓ Found ${stylesheets} stylesheet(s) loaded`);
  expect(stylesheets).toBeGreaterThan(0);

  // Check if Tailwind CSS classes are present in the DOM
  const pageContent = await page.content();
  const hasTailwind = pageContent.includes('class=') &&
                     (pageContent.includes('flex') ||
                      pageContent.includes('grid') ||
                      pageContent.includes('bg-') ||
                      pageContent.includes('text-'));
  expect(hasTailwind).toBe(true);
  console.log('✓ Tailwind CSS classes found in DOM');

  // Check body background color (should not be transparent/white if CSS is loaded)
  const bodyBg = await page.locator('body').evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });
  console.log(`✓ Body background color: ${bodyBg}`);
  expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)');
  expect(bodyBg).not.toBe('');

  // Check if buttons have proper styling
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  console.log(`✓ Found ${buttonCount} button(s)`);

  if (buttonCount > 0) {
    const firstButton = buttons.first();
    const buttonStyles = await firstButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        backgroundColor: styles.backgroundColor
      };
    });
    console.log('✓ Button styles:', buttonStyles);
    // Button should have some padding
    expect(buttonStyles.padding).not.toBe('0px');
  }

  console.log('\n✅ SUCCESS: All CSS and styling are properly restored!');
});
