const http = require('http');
const fs = require('fs');
const path = require('path');

function getProjectRoot() {
  let curr = __dirname;
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'design')) && fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(__dirname, '../../../..');
}

const ROOT = getProjectRoot();
const defaultCardsDir = path.join(ROOT, 'design/product-docs/大女主觉醒测试/assets/结果测试截图/cards');
const productDocsDir = path.join(ROOT, 'design/product-docs');
const port = Number(process.env.PORT || 8768);

function findImageFile(filename) {
  // 1. 优先检查环境变量指定的 CARDS_DIR
  if (process.env.CARDS_DIR) {
    const p = path.resolve(process.env.CARDS_DIR, filename);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }

  // 2. 检查大女主觉醒测试默认目录
  const pDef = path.join(defaultCardsDir, filename);
  if (fs.existsSync(pDef) && fs.statSync(pDef).isFile()) return pDef;

  // 3. 检查 fixtures/cards 目录
  const pFix = path.join(ROOT, '.scratch/xhs-draft-autofill/fixtures/cards', filename);
  if (fs.existsSync(pFix) && fs.statSync(pFix).isFile()) return pFix;

  // 4. 自动遍历搜索 product-docs 下所有测试的 cards 目录
  if (fs.existsSync(productDocsDir)) {
    try {
      const tests = fs.readdirSync(productDocsDir);
      for (const t of tests) {
        const pTest = path.join(productDocsDir, t, 'assets/结果测试截图/cards', filename);
        if (fs.existsSync(pTest) && fs.statSync(pTest).isFile()) return pTest;
      }
    } catch (_) {}
  }

  return null;
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, root: ROOT, port }));
    return;
  }

  const rawUrl = req.url.split('?')[0];
  const filename = path.basename(decodeURIComponent(rawUrl));
  const fullPath = findImageFile(filename);

  if (fullPath) {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'image/png'
    });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`IMAGE_SERVER_RUNNING on http://127.0.0.1:${port} root=${ROOT}`);
});
