const fs = require('fs');
const path = require('path');
// 直接引用 emotional-friction-test 已经安装的 archiver
const { ZipArchive } = require(path.join(__dirname, 'emotional-friction-test', 'node_modules', 'archiver'));

const targetDir = path.join(__dirname, 'emotional-friction-test');
const output = fs.createWriteStream(path.join(__dirname, 'test-platform.zip'));
const archive = new ZipArchive({
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log('✅ 打包成功! 总字节数: ' + archive.pointer());
  console.log('请将生成的 code-posix.zip 上传至云开发控制台（云托管）进行部署。');
  console.log('💡 提示：该压缩包已为您将 emotional-friction-test 下的所有测试（内耗、恋人等）合并打包。');
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
    '*.log.txt',
    '.git/**'
  ],
  dot: true 
});

archive.finalize();
