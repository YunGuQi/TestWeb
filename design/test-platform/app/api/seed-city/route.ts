import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { CITY_QUESTIONS_FALLBACK } from '../../../lib/city-fallback';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 直接复用 lib/city-fallback.ts 作为单一真相源 (SSOT)
const CITY_QUESTIONS = CITY_QUESTIONS_FALLBACK.map(q => ({
  testId: 'city-personality',
  order: q.order,
  text: q.text,
  options: q.options.map(opt => ({
    text: opt.text,
    scores: typeof opt.scores === 'string' ? opt.scores : JSON.stringify(opt.scores)
  }))
}));

// 情绪测试弹幕内容（从本地 SQLite 恢复）
const EMO_DANMAKU = "{\"low\":[\"这也太酷了吧！\",\"羡慕这种精神状态\",\"如何拥有这种顶级钝感力？\",\"本内耗王者实名羡慕了\",\"只要我没素质，素质就绑架不了我\"],\"bnd\":[\"确实，内耗太费精力了\",\"精准命中我的生活哲学\",\"只要我跑得快，内耗就追不上我\",\"这小票打印得没毛病\",\"真实，守住自己的能量才是王道\"],\"sen\":[\"是谁在监视我？\",\"特定触发破防太真实了\",\"平时稳如老狗，一触雷就炸\",\"装死第一名就是我\",\"薛定谔的敏感，简直为我量身定制\"],\"pls\":[\"啊啊啊这就是我！\",\"每次答应完就后悔，说的就是我\",\"讨好型人格破大防了\",\"看这个小票直接看哭了\",\"救命，怎么才能学会拒绝啊\"],\"rum\":[\"深夜批斗会VIP会员在此\",\"原来大家睡前都在复盘啊\",\"别骂了别骂了，已经在抠脚趾了\",\"白天笑嘻嘻，晚上全网黑历史首播\",\"过于真实，引起不适\"],\"sen_pls\":[\"本海绵精快被吸干了\",\"极度共情真的好累\",\"别再给我倒苦水了啊啊啊\",\"看到这句话直接泪奔\",\"感觉每天都在为别人活着\"],\"high\":[\"脑补王者就是我\",\"这账单数字简直惊心动魄\",\"每天在心里演完了一整部甄嬛传\",\"救救孩子吧，太累了\",\"这就是我为什么周末只想躺着\"],\"rum_low_bnd\":[\"破防了，为什么要这么残忍地戳穿我\",\"对自己最狠的人原来是我自己\",\"不敢看第二遍的测试\",\"原来内伤都是我自己打的\",\"抱抱自己吧，真的太难了\"]}";

const CITY_DANMAKU = "{\"industrial\":[\"这城市简直为我量身定做\",\"就是喜欢这种效率至上的感觉\",\"搞钱搞钱，工作使我快乐\",\"打工人不睡觉\",\"高楼大厦才是我真正的归宿\"],\"cyber\":[\"太酷了吧这赛博朋克感\",\"我就是夜行动物\",\"越夜越美丽\",\"这就是我的主场\",\"简直是我的精神故乡\"],\"wabisabi\":[\"慢下来才能体会生活\",\"岁月静好才是真的好\",\"喜欢这种历史沉淀的感觉\",\"一壶茶一坐就是一下午\",\"这就是我想要的退休生活\"],\"nature\":[\"果然我应该去没有天花板的地方\",\"旷野才是我的归属\",\"看着这个结果觉得好治愈\",\"不想卷了，带我走吧\",\"逃离钢铁森林成功\"],\"ocean\":[\"想去海边吹风了\",\"极度浪漫说的是我没错了\",\"好想去海边躺平啊\",\"生活就是一场微醺\",\"看到这片海就觉得很放松\"]}";

export async function GET(req: Request) {
  const log: string[] = [];
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    // --- 1. 修复情绪测试弹幕 ---
    const emoConfig = await prisma.globalConfig.findFirst({ where: { testId: 'emotional-friction' } });
    if (emoConfig) {
      await prisma.globalConfig.update({
        where: { id: emoConfig.id },
        data: { danmakuContent: EMO_DANMAKU }
      });
      log.push('✅ 情绪测试弹幕已恢复');
    }

    // --- 2. 清理并同步城市题目（单源更新）---
    const existingCityCount = await prisma.question.count({ where: { testId: 'city-personality' } });
    log.push(`ℹ️ 当前城市题数量: ${existingCityCount}`);

    // 当传入 ?force=true 或题目数不为 20 时，执行全新刷新
    if (force || existingCityCount !== 20) {
      const existingIds = await prisma.question.findMany({
        where: { testId: 'city-personality' },
        select: { id: true }
      });
      for (const { id } of existingIds) {
        await prisma.option.deleteMany({ where: { questionId: id } });
        await prisma.question.delete({ where: { id } });
      }
      log.push(`🗑️ 已清理 ${existingIds.length} 道旧城市题`);

      // 从 CITY_QUESTIONS_FALLBACK 单源写入 20 道新标准题
      for (const q of CITY_QUESTIONS) {
        await prisma.question.create({
          data: {
            testId: q.testId,
            order: q.order,
            text: q.text,
            options: { create: q.options }
          }
        });
      }
      log.push(`✅ ${CITY_QUESTIONS.length} 道城市题已全新写入 (单源 SSOT)`);
    } else {
      log.push(`✅ 城市题数量已正常 (${existingCityCount} 道)，若需强制重写请传 ?force=true`);
    }

    // --- 3. 确保城市测试 GlobalConfig 存在 ---
    const cityConfig = await prisma.globalConfig.findFirst({ where: { testId: 'city-personality' } });
    if (!cityConfig) {
      await prisma.globalConfig.create({
        data: { testId: 'city-personality', baseCount: 0, danmakuSpeed: 50, danmakuOpacity: 70, danmakuContent: CITY_DANMAKU }
      });
      log.push('✅ 城市测试 GlobalConfig 已创建');
    } else {
      await prisma.globalConfig.update({
        where: { id: cityConfig.id },
        data: { danmakuContent: CITY_DANMAKU }
      });
      log.push('✅ 城市测试弹幕已更新');
    }

    return NextResponse.json({ success: true, message: '城市测试单源 Seed 成功！', log });
  } catch (error: any) {
    console.error('seed-city error:', error);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  }
}
