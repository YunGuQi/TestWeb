const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function exportAssets() {
  console.log('🚀 [1/4] 启动高精 Playwright 浏览器渲染器...');
  const outputDir = path.resolve(__dirname, 'output', 'destiny-lover-live');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. 生成静止高清 1080x1440 小红书 3:4 图文封面图
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1440 },
    deviceScaleFactor: 2 // 2倍高清缩放，导出 2160x2880 超高清分辨率
  });
  
  const page = await context.newPage();
  const htmlPath = 'file:///' + path.resolve(__dirname, 'design/test-platform/public/prototype-destiny-lover-result-live.html').replace(/\\/g, '/');
  
  console.log('📄 [2/4] 加载宿命恋人测试结果 Live Photo 原型网页...');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });
  
  // 激活纯净模式，隐藏顶部控制栏
  await page.evaluate(() => {
    document.body.classList.add('pure-mode');
  });

  // 等待 1.5 秒让初次加载动画、印章动画完全呈现
  await page.waitForTimeout(1500);

  // 截图结果 1：护法骑士
  const path1 = path.join(outputDir, 'result_01_knight_3-4.png');
  await page.screenshot({ path: path1, fullPage: false });
  console.log('✅ 已导出 [结果1·护法骑士]: ' + path1);

  // 切换至结果 2：宿命克星
  await page.evaluate(() => {
    if (typeof setResultType === 'function') {
      setResultType('nemesis');
    }
  });
  await page.waitForTimeout(1000);
  const path2 = path.join(outputDir, 'result_02_nemesis_3-4.png');
  await page.screenshot({ path: path2, fullPage: false });
  console.log('✅ 已导出 [结果2·宿命克星]: ' + path2);

  // 切换至结果 3：直球少爷
  await page.evaluate(() => {
    if (typeof setResultType === 'function') {
      setResultType('sunshine');
    }
  });
  await page.waitForTimeout(1000);
  const path3 = path.join(outputDir, 'result_03_sunshine_3-4.png');
  await page.screenshot({ path: path3, fullPage: false });
  console.log('✅ 已导出 [结果3·直球少爷]: ' + path3);

  await browser.close();

  // 2. 录制 5秒 1080x1440 Live Photo 实况互动视频 MP4
  console.log('🎬 [3/4] 启动 5 秒实况录像模式 (导出 Live Photo 实况短视频)...');
  const videoBrowser = await chromium.launch({ headless: true });
  const videoContext = await videoBrowser.newContext({
    viewport: { width: 1080, height: 1440 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1080, height: 1440 }
    }
  });

  const videoPage = await videoContext.newPage();
  await videoPage.goto(htmlPath, { waitUntil: 'domcontentloaded' });
  await videoPage.evaluate(() => {
    document.body.classList.add('pure-mode');
    if (typeof setResultType === 'function') {
      setResultType('knight'); // 录制经典翡翠高定经典款
    }
  });

  // 持续运行 5.2 秒以录制完整实况循环
  await videoPage.waitForTimeout(5200);

  // 关闭网页以生成录像文件
  const videoPath = await videoPage.video().path();
  await videoContext.close();
  await videoBrowser.close();

  const finalVideoPath = path.join(outputDir, 'result_01_knight_livephoto_5s.mp4');
  if (fs.existsSync(videoPath)) {
    fs.renameSync(videoPath, finalVideoPath);
    console.log('✅ 已导出 [5秒实况 Live Photo MP4]: ' + finalVideoPath);
  }

  console.log('\n🎉 全部小红书 3:4 实况测试结果图文与视频已导出完毕！');
  console.log('存放目录:', outputDir);
}

exportAssets().catch(err => {
  console.error('导出出错:', err);
  process.exit(1);
});
