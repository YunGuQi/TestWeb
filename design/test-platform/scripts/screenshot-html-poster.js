const fs = require('fs');
const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\GU\\.gemini\\antigravity-ide\\brain\\60987e47-09db-4361-ac36-58dc33c0e421';
const QIANFAN_DIR = 'E:\\AI\\Antigravity\\小红书\\帖子物料\\宿命恋人\\千帆';
const PUBLIC_DIR = 'E:\\AI\\Antigravity\\小红书\\design\\test-platform\\public\\images\\destiny-lover-poster';
const HTML_FILE = 'file:///e:/AI/Antigravity/%E5%B0%8F%E7%BA%A2%E4%B9%A6/design/test-platform/public/prototype-destiny-lover-poster.html';

(async () => {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.mkdirSync(QIANFAN_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log('加载本地 HTML 原型，开始全系截取 14 款主图方案 (重点出图 L~N：宫崎骏、鸟山明、斯皮尔伯格巨匠专区)...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1000, height: 1000 });

  await page.goto(HTML_FILE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const variants = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    console.log(`- 高清截取 Variant ${variant}...`);
    
    await page.evaluate((idx) => {
      currentIndex = idx;
      updateDisplay();
    }, i);
    await page.waitForTimeout(400);

    await page.evaluate(() => {
      document.getElementById('top-control').classList.add('hidden');
      document.getElementById('bottom-control').classList.add('hidden');
      const exitBtn = document.getElementById('pure-exit-btn');
      if (exitBtn) exitBtn.classList.add('hidden');
    });
    await page.waitForTimeout(300);

    const el = page.locator('#variant-' + variant);
    const savePath1 = path.join(ARTIFACTS_DIR, `poster-variant-${variant.toLowerCase()}.png`);
    const savePath2 = path.join(QIANFAN_DIR, `poster-variant-${variant.toLowerCase()}.png`);
    const savePath3 = path.join(PUBLIC_DIR, `poster-variant-${variant.toLowerCase()}.png`);
    await el.screenshot({ path: savePath1 });
    fs.copyFileSync(savePath1, savePath2);
    fs.copyFileSync(savePath1, savePath3);
    console.log(`✔ Variant ${variant} 1:1 截图已同步到千帆库与公用资源: ${savePath2}`);

    if (variant === 'L') {
      fs.copyFileSync(savePath1, path.join(QIANFAN_DIR, '01_商品首图_巨匠吉卜力风.png'));
    }
    if (variant === 'A') {
      fs.copyFileSync(savePath1, path.join(QIANFAN_DIR, '01_商品首图_潮流Y2K酸性风.png'));
    }
    if (variant === 'G') {
      fs.copyFileSync(savePath1, path.join(QIANFAN_DIR, '01_商品首图_多巴胺调频卡.png'));
    }

    await page.evaluate(() => {
      document.getElementById('top-control').classList.remove('hidden');
      document.getElementById('bottom-control').classList.remove('hidden');
    });
  }

  await browser.close();
  console.log('全场 14 款顶级主图 (特别包含宫崎骏、鸟山明、斯皮尔伯格等大师名作系列) 高清截屏结束！');
})();
