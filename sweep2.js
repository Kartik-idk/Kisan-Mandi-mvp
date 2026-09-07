const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  let currentRoute = '/';
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[${currentRoute}] Console Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', exception => {
    errors.push(`[${currentRoute}] Uncaught Exception: ${exception.message}`);
  });
  
  const routes = ['/', '/farmer', '/agent', '/merchant', '/palledar', '/manager'];
  
  for (const route of routes) {
    currentRoute = route;
    console.log(`Visiting ${route}...`);
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); 
  }
  
  await browser.close();
  
  if (errors.length > 0) {
    console.log(errors.join('\\n'));
  } else {
    console.log("SWEEP_CLEAN");
  }
})();
