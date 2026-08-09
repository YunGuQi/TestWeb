const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

// 生成指定数量的随机不重复卡密
function generateCodes(count, length = 8) {
  const codes = new Set();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除容易混淆的 0/O/1/I
  
  while (codes.size < count) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.add(code);
  }
  return Array.from(codes);
}

async function main() {
  // 参数设置
  const testId = process.argv[2] || 'emo'; // 默认测试ID
  const count = parseInt(process.argv[3]) || 100; // 默认生成数量
  
  console.log(`🚀 开始为测试 [${testId}] 生成 ${count} 个独立卡密...`);
  
  const codes = generateCodes(count);
  
  // 1. 批量写入数据库
  const data = codes.map(code => ({
    testId,
    code,
    maxUses: 3, // 每个卡密最大绑定设备数
    isDisabled: false,
    devices: '[]'
  }));

  try {
    const result = await prisma.activationCode.createMany({
      data,
      skipDuplicates: true // 忽略已经存在的重复卡密
    });
    
    console.log(`✅ 成功将 ${result.count} 个卡密存入数据库。`);
    
    // 2. 导出为 TXT 文件供阿奇索导入
    const exportFileName = `agiso_export_${testId}_${Date.now()}.txt`;
    const exportPath = path.join(__dirname, '..', exportFileName);
    
    // 阿奇索卡券仓库标准格式：一行一个卡密
    fs.writeFileSync(exportPath, codes.join('\n'));
    
    console.log(`🎉 卡密导出成功！`);
    console.log(`👉 文件已保存至：${exportPath}`);
    console.log(`💡 请直接将此 txt 文件上传至【阿奇索后台 -> 91卡券仓库 -> 导入卡密】即可！`);
    
  } catch (error) {
    console.error('❌ 生成失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
