const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error]: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      warnings.push(`[Console Warning]: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', exception => {
    errors.push(`[Uncaught Exception]: ${exception.message}`);
  });

  const routes = [
    { url: '/farmer', role: 'FARMER', id: 'deb1b2e8-6711-4901-bfde-b0ef47900bee' },
    { url: '/agent', role: 'AGENT', id: 'd7f5b2d6-bc69-4598-b6a5-efb91109a66e' },
    { url: '/merchant', role: 'MERCHANT', id: 'ea35b561-b22e-4e02-a6fc-d6bd622c125c' },
    { url: '/palledar', role: 'PALLEDAR', id: 'dedccb6d-cd23-4c24-9f2a-af7fb4b803b2' },
    { url: '/manager', role: 'MANAGER', id: '5738b906-cc01-40cf-bb1b-e455a0ebb3b0' }
  ];
  
  // Set auth state
  await page.goto('http://localhost:3000');
  
  for (const route of routes) {
    console.log(`Testing ${route.url}...`);
    
    // Inject auth
    await page.evaluate((id) => {
      localStorage.setItem('mandi_user_id', id);
    }, route.id);
    
    await page.goto(`http://localhost:3000${route.url}`, { waitUntil: 'networkidle' });
    
    // Wait for data fetch
    await page.waitForTimeout(1500); 

    // Find all buttons and click them (safely)
    try {
      const buttons = await page.$$('button');
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        const text = await buttons[i].textContent();
        if (text && !text.toLowerCase().includes("sign out")) {
          // Avoid clicking buttons that navigate away or cause destructive alerts
          if (!text.toLowerCase().includes("mark") && !text.toLowerCase().includes("pay") && !text.toLowerCase().includes("auction")) {
             await buttons[i].click({ timeout: 500 }).catch(() => {});
             await page.waitForTimeout(300);
          }
        }
      }
    } catch(e) {}

    // Type into inputs if any
    try {
      const inputs = await page.$$('input[type="text"], input[type="number"]');
      for (const input of inputs) {
        await input.fill('9999').catch(() => {});
      }
    } catch(e) {}
  }
  
  await browser.close();
  
  const report = {
    errors,
    warnings,
    evaluatedRoutes: routes.map(r => r.url)
  };
  
  fs.writeFileSync('sweep-report.json', JSON.stringify(report, null, 2));
  console.log("DONE");
})();
