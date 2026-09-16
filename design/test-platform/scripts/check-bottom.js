const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); // 模拟典型手机屏幕
  const page = await context.newPage();

  await page.goto('http://localhost:3000/emo', { waitUntil: 'networkidle' });
  await page.click('#btn-start');

  for (let q = 1; q <= 20; q++) {
    const firstOpt = page.locator('#options-container button').first();
    await firstOpt.waitFor({ state: 'visible', timeout: 5000 });
    await firstOpt.click();
    await page.waitForTimeout(250);
  }

  await page.waitForSelector('#btn-submit', { state: 'visible', timeout: 5000 });
  await page.click('#btn-submit');

  await page.waitForSelector('#view-result', { timeout: 10000 });
  await page.waitForTimeout(500);

  // 模拟输入卡密解锁
  const unlockBtn = await page.$('#btn-show-unlock');
  if (unlockBtn) {
    await unlockBtn.click();
    await page.waitForSelector('#input-verify', { state: 'visible' });
    await page.fill('#input-verify', 'CODE-JIE');
    await page.click('#btn-verify');
    await page.waitForTimeout(1000);
  }

  // 滚到最底部
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  await page.waitForTimeout(600);

  const screenshotPath = path.join(__dirname, '../.scratch/bottom-check.png');
  await page.screenshot({ path: screenshotPath });
  console.log('✅ 底部排版截图已保存:', screenshotPath);

  await browser.close();
})();
