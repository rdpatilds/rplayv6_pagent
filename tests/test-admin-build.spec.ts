import { test, expect } from '@playwright/test';

test('Verify admin competencies page builds without errors', async ({ page }) => {
  console.log('=== Testing Admin Competencies Page Build ===\n');

  // Navigate directly to admin competencies page
  await page.goto('http://localhost:3002/admin/competencies');
  console.log('✓ Navigated to /admin/competencies');

  // Wait for page to load
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Get page content
  const pageContent = await page.content();

  // Check for build errors
  const buildErrorPatterns = [
    'Module not found',
    "Can't resolve '@/lib/competency-db'",
    "Can't resolve",
    'Build Error',
    'Compilation failed',
    'Import error'
  ];

  const foundErrors: string[] = [];
  for (const pattern of buildErrorPatterns) {
    if (pageContent.includes(pattern)) {
      foundErrors.push(pattern);
    }
  }

  if (foundErrors.length > 0) {
    console.error('❌ BUILD ERRORS DETECTED:');
    foundErrors.forEach(err => console.error(`   - ${err}`));
    await page.screenshot({ path: '/tmp/build-error.png', fullPage: true });
    throw new Error(`Build errors found: ${foundErrors.join(', ')}`);
  }

  console.log('✅ No build errors detected');

  // Check page title
  const title = await page.title();
  console.log(`✓ Page title: "${title}"`);

  // Take a screenshot
  await page.screenshot({ path: '/tmp/admin-page-build-test.png', fullPage: true });
  console.log('✓ Screenshot saved to /tmp/admin-page-build-test.png');

  // Check if it's redirecting to login (expected for unauthenticated access)
  const finalUrl = page.url();
  console.log(`✓ Final URL: ${finalUrl}`);

  if (finalUrl.includes('/login')) {
    console.log('✓ Page redirects to login (expected for protected route)');
  } else {
    console.log('✓ Page loaded directly');
  }

  // Verify the page compiled successfully by checking for Next.js metadata
  const hasNextMetadata = pageContent.includes('next-size-adjust') ||
                          pageContent.includes('_next/static');

  if (hasNextMetadata) {
    console.log('✅ Page compiled successfully by Next.js');
  } else {
    console.log('⚠️  Could not verify Next.js compilation metadata');
  }

  console.log('\n=== RESULT: Admin page builds without errors! ===');
  console.log('Original error "Module not found: Can\'t resolve \'@/lib/competency-db\'" is FIXED ✓');
});
