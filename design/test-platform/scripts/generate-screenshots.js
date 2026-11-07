const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PREVIEW_SECRET = process.env.ADMIN_PREVIEW_SECRET || 'mutong-preview-secret-2026';

const CITY_SLUGS = [
  'c_sz8a1f', 'c_sh3e91', 'c_bj7d2a', 'c_cd5f8c', 'c_gz2b4e', 'c_hz9a63',
  'c_wh1c70', 'c_nj4e82', 'c_cq6b39', 'c_xa0f51', 'c_cs8d14', 'c_xm3a97',
  'c_qd7c28', 'c_km5e60', 'c_dl2f43', 'c_alt918'
];

const EMO_SLUG_MAP = {
  'low': 'e_lw839b',
  'bnd': 'e_bd645c',
  'sen': 'e_sn710b',
  'pls': 'e_ps824d',
  'rum': 'e_rm4c77',
  'sen_pls': 'e_sp931a',
  'high': 'e_hg102a',
  'rum_low_bnd': 'e_rlb452'
};

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 420, height: 900 });

  fs.mkdirSync('public/images/city', { recursive: true });
  fs.mkdirSync('public/images/emo', { recursive: true });

  console.log('Generating City Screenshots...');
  for (let i = 0; i < CITY_SLUGS.length; i++) {
    const slug = CITY_SLUGS[i];
    console.log(`- City ${i + 1} (${slug})...`);
    await page.goto(`http://localhost:3005/city/preview?slug=${slug}&secret=${encodeURIComponent(PREVIEW_SECRET)}`);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    const element = await page.waitForSelector('#ticket-capture');
    await page.waitForTimeout(1000); // Wait for fonts and animations
    await element.screenshot({ path: `public/images/city/${i + 1}.png` });
  }

  console.log('Generating Emo Screenshots...');
  for (const [key, slug] of Object.entries(EMO_SLUG_MAP)) {
    console.log(`- Emo ${key} (${slug})...`);
    await page.goto(`http://localhost:3005/emo/preview?slug=${slug}&secret=${encodeURIComponent(PREVIEW_SECRET)}`);
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
    const element = await page.waitForSelector('#poster-container');
    await page.waitForTimeout(2000); // Wait for fonts and animations
    await element.screenshot({ path: `public/images/emo/${key}.png` });
  }

  await browser.close();
  console.log('Done!');
})();
