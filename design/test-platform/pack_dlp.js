const fs = require('fs');
const path = require('path');
const archiverMod = require('../framework-apps/emotional-friction-test/node_modules/archiver');
const ZipArchive = archiverMod.ZipArchive || archiverMod;

function createDeployZip() {
  const zipPath = path.join(__dirname, 'deploy.zip');
  console.log('正在通过 Node.js 特权进程生成纯明文增量包:', zipPath);

  const output = fs.createWriteStream(zipPath);
  const archive = new ZipArchive({
    zlib: { level: 9 }
  });

  output.on('close', function () {
    console.log(`✅ 纯明文增量部署包创建成功！总大小: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  });

  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      console.warn('警告:', err);
    } else {
      throw err;
    }
  });

  archive.on('error', function (err) {
    throw err;
  });

  archive.pipe(output);

  const targets = [
    '.next',
    'public',
    'prisma',
    'package.json',
    'next.config.js',
    '.env',
    'node_modules/@prisma/client',
    'node_modules/.prisma',
    'app',
    'lib'
  ];

  targets.forEach(target => {
    const fullPath = path.join(__dirname, target);
    if (!fs.existsSync(fullPath)) return;

    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      archive.file(fullPath, { name: target });
    } else if (stat.isDirectory()) {
      archive.glob('**/*', {
        cwd: fullPath,
        ignore: [
          '**/cache/**',
          '**/dev/**',
          '**/*.db',
          '**/*.db-journal',
          '**/.git/**'
        ],
        dot: true
      }, {
        prefix: target
      });
    }
  });

  archive.finalize();
}

createDeployZip();
