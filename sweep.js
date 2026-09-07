const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', exception => {
    errors.push(`Uncaught Exception: ${exception.message}`);
  });
  
  const routes = ['/', '/farmer', '/agent', '/merchant', '/palledar', '/manager'];
  
  for (const route of routes) {
    console.log(`Visiting ${route}...`);
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
    
    // Simulate some basic interactions to trigger potential bugs
    // (Wait for any modals to render, click some buttons if available)
    try {
      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        // Just click the first safe-looking button to test interactions
        // Not all buttons, as it might navigate away.
        await buttons[0].click({ timeout: 1000 }).catch(() => {});
      }
    } catch(e) {}
    
    await page.waitForTimeout(1000); // give it a second to fetch data
  }
  
  await browser.close();
  
  if (errors.length > 0) {
    console.log("ERRORS_FOUND");
    console.log(errors.join('\n'));
  } else {
    console.log("SWEEP_CLEAN");
  }
})();
