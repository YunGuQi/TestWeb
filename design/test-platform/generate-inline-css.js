const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('正在生成防 DLP 加密的内联 CSS 文件...');
try {
  const css = execSync('npx tailwindcss -i ./app/globals.css --minify', {
    cwd: __dirname,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024
  });

  const content = `// 此文件由 generate-inline-css.js 自动生成
// 目的：将 Tailwind CSS 嵌入 JS 产物以绕过 DLP 对 .css 文件的加密
// 请勿手动修改此文件

export const tailwindInlineCss: string = ${JSON.stringify(css)};
`;

  const targetPath = path.join(__dirname, 'lib', 'tailwind-inline.ts');
  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log(`✅ 内联 CSS 生成完毕！写入: ${targetPath} (大小: ${(content.length / 1024).toFixed(2)} KB)`);
} catch (err) {
  console.error('生成内联 CSS 失败:', err);
  process.exit(1);
}
