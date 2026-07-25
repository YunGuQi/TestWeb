const fs = require('fs');
const path = require('path');

const dirsToScan = [
  'E:/AI/Antigravity/小红书/design/test-platform/app/city',
  'E:/AI/Antigravity/小红书/design/test-platform/app/api/city',
  'E:/AI/Antigravity/小红书/design/test-platform/components/city',
  'E:/AI/Antigravity/小红书/design/test-platform/lib/city'
];

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const replacements = [
  { from: /@\/components\//g, to: '@/components/city/' },
  { from: /@\/config\//g, to: '@/lib/city/config/' },
  { from: /@\/services\//g, to: '@/lib/city/services/' },
  { from: /@\/store\//g, to: '@/lib/city/store/' },
  { from: /'\/api\//g, to: "'/api/city/" }, 
  { from: /"\/api\//g, to: '"/api/city/' },
  { from: /`\/api\//g, to: '`/api/city/' }
];

let filesModified = 0;

dirsToScan.forEach(dir => {
  walkDir(dir, filePath => {
    if (!filePath.match(/\.(tsx|ts|js|jsx)$/)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
      filesModified++;
    }
  });
});

console.log('Total files modified:', filesModified);
