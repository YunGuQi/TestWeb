const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CITY_COUNT = 34;
const EMO_KEYS = ['low', 'bnd', 'sen', 'pls', 'rum', 'sen_pls', 'high', 'rum_low_bnd'];

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 420, height: 900 });

  fs.mkdirSync('public/images/city', { recursive: true });
  fs.mkdirSync('public/images/emo', { recursive: true });

  console.log('Generating City Screenshots...');
  for (let i = 1; i <= CITY_COUNT; i++) {
    console.log(`- City ${i}...`);
    await page.goto(`http://localhost:3005/city/preview?id=${i}`);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    const element = await page.waitForSelector('#ticket-capture');
    await page.waitForTimeout(1000); // Wait for fonts and animations
    await element.screenshot({ path: `public/images/city/${i}.png` });
  }

  console.log('Generating Emo Screenshots...');
  for (const key of EMO_KEYS) {
    console.log(`- Emo ${key}...`);
    await page.goto(`http://localhost:3005/emo/preview?id=${key}`);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    const element = await page.waitForSelector('#poster-container');
    await page.waitForTimeout(2000); // Wait for fonts and animations
    await element.screenshot({ path: `public/images/emo/${key}.png` });
  }

  await browser.close();
  console.log('Done!');
})();
