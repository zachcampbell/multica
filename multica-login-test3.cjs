const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('hydrat') || msg.text().includes('Hydrat') || msg.text().includes('mismatch')) {
      console.log('CONSOLE:', msg.type(), msg.text());
    }
  });

  await page.goto('http://biggie:3000/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check for hydration errors and React state
  const diag = await page.evaluate(() => {
    const errors = [];
    // Check for React hydration error markers
    const root = document.getElementById('__next');
    if (root) {
      const reactRoot = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
      errors.push('React root key: ' + (reactRoot || 'NONE'));
    }

    const form = document.getElementById('login-form');
    if (form) {
      const formKeys = Object.keys(form).filter(k => k.startsWith('__react'));
      errors.push('Form react keys: ' + formKeys.join(', '));
      errors.push('Form onsubmit: ' + String(form.onsubmit));
    } else {
      errors.push('No form found');
    }

    const btn = document.querySelector('button[type="submit"]');
    if (btn) {
      const btnKeys = Object.keys(btn).filter(k => k.startsWith('__react'));
      errors.push('Button react keys: ' + btnKeys.join(', '));
    }

    return errors;
  });

  console.log('Diagnostics:', diag);

  // Try preventing default ourselves and calling the React handler
  await page.fill('input[type="email"]', 'zach@nuso.cloud');

  // Instead of clicking, dispatch a submit event with preventDefault
  await page.evaluate(() => {
    const form = document.getElementById('login-form');
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      const prevented = !form.dispatchEvent(event);
      console.log('Form submit dispatched, default prevented:', prevented);
    }
  });

  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/multica-debug2.png' });
  console.log('URL:', page.url());

  // Check if step changed
  const hasOTP = await page.locator('[data-input-otp]').count();
  console.log('Has OTP:', hasOTP);

  await browser.close();
})();
