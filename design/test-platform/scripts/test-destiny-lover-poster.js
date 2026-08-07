const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\GU\\.gemini\\antigravity-ide\\brain\\42f9a4a5-591a-4633-97c5-bd236cce691e';
const PUBLIC_DIR = 'e:\\AI\\Antigravity\\小红书\\design\\test-platform\\public\\images\\destiny-lover-poster';

(async () => {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  console.log('启动 Next.js 临时测试服务 (端口 3099)...');
  const server = spawn('npx', ['next', 'dev', '-p', '3099'], {
    cwd: 'e:\\AI\\Antigravity\\小红书\\design\\test-platform',
    shell: true,
  });

  let serverReady = false;
  server.stdout.on('data', (data) => {
    const text = data.toString();
    console.log('[Next.js]:', text.trim());
    if (text.includes('Ready in') || text.includes('3099') || text.includes('started server')) {
      serverReady = true;
    }
  });

  server.stderr.on('data', (data) => {
    console.error('[Next.js Error]:', data.toString().trim());
  });

  console.log('等待服务初始化完毕 (6s)...');
  await new Promise(resolve => setTimeout(resolve, 6000));

  console.log('启动 Playwright 浏览器进行 1:1 截取渲染...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // 设置宽高为了适配居中的800x800正方形主图
  await page.setViewportSize({ width: 1000, height: 1000 });

  const variants = ['A', 'B', 'C'];

  for (const variant of variants) {
    console.log(`- 正在访问并截取 Variant ${variant}...`);
    const url = `http://localhost:3099/prototype/destiny-lover-poster?variant=${variant}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // 等待页面首次编译完成与渲染
    
    // 按 M 键隐藏控制栏进入纯净模式
    await page.keyboard.press('m');
    await page.waitForTimeout(1500);

    // 找到核心的 800x800 正方形主图容器并精细截图
    const container = page.locator('.my-16');
    const box = await container.boundingBox();
    
    const publicPath = path.join(PUBLIC_DIR, `variant-${variant.toLowerCase()}.png`);
    const artifactPath = path.join(ARTIFACTS_DIR, `variant-${variant.toLowerCase()}.png`);

    if (box) {
      await container.screenshot({ path: publicPath });
      await container.screenshot({ path: artifactPath });
    } else {
      // 保底处理全屏截取中部的 800x800
      await page.screenshot({ 
        path: publicPath,
        clip: { x: 100, y: 100, width: 800, height: 800 }
      });
      await page.screenshot({ 
        path: artifactPath,
        clip: { x: 100, y: 100, width: 800, height: 800 }
      });
    }

    console.log(`✔ Variant ${variant} 1:1 展示图已成功保存: ${artifactPath}`);
  }

  await browser.close();
  console.log('关闭开发服务...');
  server.kill('SIGINT');
  console.log('验证脚本全部执行完成！');
  process.exit(0);
})();
