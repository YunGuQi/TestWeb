const fs = require('fs');
const path = require('path');
// 直接引用 shared-backend 已经安装的 archiver
const { ZipArchive } = require(path.join(__dirname, 'node_modules', 'archiver'));

const targetDir = __dirname;
const output = fs.createWriteStream(path.join(__dirname, 'shared-backend.zip'));
const archive = new ZipArchive({
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log('✅ 打包成功! 总字节数: ' + archive.pointer());
  console.log('请将生成的 shared-backend.zip 上传至云开发控制台（云托管）进行后端部署。');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('警告:', err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// 打包目标文件夹下的所有内容
archive.glob('**/*', {
  cwd: targetDir,
  ignore: [
    'node_modules/**',
    '.next/**',
    'deploy.zip',
    'code-posix.zip',
    'code.zip',
    'shared-backend.zip',
    '*.log.txt',
    '.git/**'
  ],
  dot: true 
});

archive.finalize();
