const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('FAIL:', req.url(), req.failure()?.errorText));
  page.on('request', req => {
    if (req.url().includes('auth')) console.log('REQUEST:', req.method(), req.url());
  });
  page.on('response', resp => {
    if (resp.url().includes('auth')) console.log('RESPONSE:', resp.status(), resp.url());
  });

  console.log('=== Navigating ===');
  await page.goto('http://biggie:3000/login');
  await page.waitForLoadState('networkidle');

  // Wait extra for hydration
  await page.waitForTimeout(2000);

  console.log('=== Filling email ===');
  await page.fill('input[type="email"]', 'zach@nuso.cloud');

  // Intercept form submission to prevent native submit
  console.log('=== Clicking via JS to avoid native submit ===');

  // Use page.evaluate to click and capture any errors
  const result = await page.evaluate(async () => {
    try {
      const btn = document.querySelector('button[type="submit"]');
      if (!btn) return 'No submit button found';

      // Check if React event handlers are attached
      const reactProps = Object.keys(btn).filter(k => k.startsWith('__react'));
      const formEl = document.getElementById('login-form');
      const formReactProps = formEl ? Object.keys(formEl).filter(k => k.startsWith('__react')) : [];

      btn.click();

      // Wait a bit
      await new Promise(r => setTimeout(r, 2000));

      return {
        btnReactProps: reactProps,
        formReactProps: formReactProps,
        currentHTML: document.body.innerHTML.substring(0, 300)
      };
    } catch(e) {
      return 'Error: ' + e.message;
    }
  });

  console.log('=== Result ===', JSON.stringify(result, null, 2));

  await page.screenshot({ path: '/tmp/multica-debug.png' });
  console.log('URL after:', page.url());

  await browser.close();
})();
