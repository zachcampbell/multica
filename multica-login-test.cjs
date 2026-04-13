const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure()?.errorText));

  // Log all network requests
  page.on('response', resp => {
    if (resp.url().includes('auth') || resp.url().includes('send-code') || resp.url().includes('verify')) {
      console.log('RESPONSE:', resp.status(), resp.url());
    }
  });

  console.log('Navigating to login...');
  await page.goto('http://biggie:3000/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/multica-01-loaded.png' });
  console.log('Page loaded');

  // Enter email
  console.log('Entering email...');
  await page.fill('input[type="email"]', 'zach@nuso.cloud');
  await page.screenshot({ path: '/tmp/multica-02-email.png' });

  // Click continue
  console.log('Clicking Continue...');
  await page.click('button:has-text("Continue")');

  // Wait for network activity or page change
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/multica-03-after-click.png' });
  console.log('Current URL:', page.url());
  console.log('Page content sample:', await page.textContent('body').then(t => t.substring(0, 500)));

  // Check if we got to the code step
  const hasCodeInput = await page.locator('[data-input-otp]').count();
  console.log('Has OTP input:', hasCodeInput);

  if (hasCodeInput > 0) {
    console.log('Entering code 888888...');
    // Type the code digits
    await page.locator('[data-input-otp]').pressSequentially('888888');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/multica-04-after-code.png' });
    console.log('Final URL:', page.url());
  }

  await browser.close();
})();
