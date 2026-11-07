import { prisma } from '../lib/prisma';
import { destinyLoverQuestions, destinyLoverResults } from '../lib/destiny-lover-data';

async function seed() {
  console.log('🚀 开始向宝塔远程 MySQL 数据库上传命定恋人 (destiny-lover) 题库与结果配置...');
  const testId = 'destiny-lover';

  try {
    // 1. 清理现有旧数据（Option -> Question -> ResultConfig）
    const existingCount = await prisma.question.count({ where: { testId } });
    console.log(`当前数据库中已有 ${existingCount} 道旧题目，正在执行安全覆写更新...`);

    if (existingCount > 0) {
      await prisma.option.deleteMany({ where: { question: { testId } } });
      await prisma.question.deleteMany({ where: { testId } });
    }

    // 清理旧的结果配置
    const existingResults = await prisma.resultConfig.count({ where: { testId } });
    if (existingResults > 0) {
      await prisma.resultConfig.deleteMany({ where: { testId } });
      console.log(`🗑️ 已清理旧的 ${existingResults} 个结果配置`);
    }

    // 2. 写入/更新 GlobalConfig
    const configExists = await prisma.globalConfig.findFirst({ where: { testId } });
    if (!configExists) {
      await prisma.globalConfig.create({
        data: {
          testId,
          baseCount: 68520,
          danmakuSpeed: 50,
          danmakuOpacity: 70,
          danmakuContent: JSON.stringify({
            completedBaseCount: 68520,
            danmakuList: [
              "测出了炽热破风者，准到头皮发麻！",
              "铁腕执棋人太绝了，就是我的理想型",
              "给男朋友测了一下，完全吻合",
              "已解锁完整红娘小票，已截屏",
              "月老红娘太神了，前世因缘全对上了"
            ]
          })
        }
      });
      console.log('✅ GlobalConfig 配置已创建');
    } else {
      console.log('ℹ️ GlobalConfig 配置已存在，保留当前热度底数');
    }

    // 3. 写入 16 个恋人画像结果配置 (ResultConfig)
    console.log(`\n📦 正在写入 16 画像结果配置...`);
    for (const r of destinyLoverResults) {
      await prisma.resultConfig.create({
        data: {
          testId,
          title: r.title,
          desc: r.description,
          quote: r.quote,
          imageUrl: '',
          condition: r.key // 存入 ldar, ldap 等 4 字符 key 作为判定匹配条件
        }
      });
    }
    console.log(`✅ 16 个命定恋人画像结果配置已全部上传成功！`);

    // 4. 写入 20 道标准去AI感题目与选项 (Question & Option)
    console.log(`\n📝 正在逐题写入 20 道生活哲学新题库...`);
    let order = 1;
    for (const q of destinyLoverQuestions) {
      await prisma.question.create({
        data: {
          testId,
          order: order++,
          text: q.text,
          options: {
            create: q.options.map((opt: any) => ({
              text: opt.text,
              scores: JSON.stringify(opt.scores) // 存储 { L: 1, G: 0, ... } 供管理后台查看
            }))
          }
        }
      });
      process.stdout.write(`.` );
    }
    console.log(`\n✅ 全部 20 道去AI感题目及 40 个双短语选项已全量同步到宝塔数据库！`);

    // 5. 校验数据库最终状态
    const finalQCount = await prisma.question.count({ where: { testId } });
    const finalRCount = await prisma.resultConfig.count({ where: { testId } });
    const finalOptCount = await prisma.option.count({ where: { question: { testId } } });

    console.log('\n================ 宝塔数据库状态校验 ================');
    console.log(`- 题库数量: ${finalQCount} / 20 道`);
    console.log(`- 选项数量: ${finalOptCount} / 40 个`);
    console.log(`- 画像配置: ${finalRCount} / 16 座`);
    console.log('====================================================');
    console.log('🎉 命定恋人测试数据全量同步成功！');

  } catch (error) {
    console.error('❌ 上传到宝塔数据库失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
