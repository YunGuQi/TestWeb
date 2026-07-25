import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CITY_QUESTIONS: any[] = [
  { order: 1, text: "难得的周末，你最想以哪种方式开启？", testId: 'city-personality', options: [
    { text: "睡到自然醒，然后点个外卖边吃边刷剧", scores: "{\"rhythm\":-2,\"env\":0,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"睡到自然醒\"}" },
    { text: "早就预约了网红展/Brunch，打扮精致出门", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"早就预约了\"}" },
    { text: "一个人背包去公园或山里放空", scores: "{\"rhythm\":-1,\"env\":-2,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"一个人背包\"}" },
    { text: "参加行业交流会或者搞点副业", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"参加行业交\"}" }
  ]},
  { order: 2, text: "当你感到极度内耗或焦虑时，通常会怎么缓解？", testId: 'city-personality', options: [
    { text: "找朋友去酒吧大醉一场，或者去KTV嘶吼", scores: "{\"rhythm\":0,\"env\":1,\"temp\":0,\"social\":2,\"taste\":2,\"billName\":\"找朋友去酒\"}" },
    { text: "去没有人的自然环境里待着，关掉手机", scores: "{\"rhythm\":-1,\"env\":-2,\"temp\":0,\"social\":-2,\"taste\":-1,\"billName\":\"去没有人的\"}" },
    { text: "疯狂搞钱/学习，用充实感覆盖焦虑", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"疯狂搞钱/\"}" },
    { text: "去寺庙烧香，坐在街角看大爷大妈下棋", scores: "{\"rhythm\":-2,\"env\":-1,\"temp\":0,\"social\":1,\"taste\":-1,\"billName\":\"去寺庙烧香\"}" }
  ]},
  { order: 3, text: "公司/学校群里发了一个自愿参加的团建活动，你会：", testId: 'city-personality', options: [
    { text: "只要有得玩就去，顺便认识新朋友", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"只要有得玩\"}" },
    { text: "评估一下去的话能不能拓展人脉资源", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"评估一下去\"}" },
    { text: "装作没看见，最烦这种社交活动", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"装作没看见\"}" },
    { text: "看是否有好吃的，或者能不能舒服地玩", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":0,\"social\":1,\"taste\":2,\"billName\":\"看是否有好\"}" }
  ]},
  { order: 4, text: "朋友突然爽约了，你现在一个人走在街上，你会：", testId: 'city-personality', options: [
    { text: "无所谓，找个咖啡馆坐着发呆，很享受独处", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"无所谓，找\"}" },
    { text: "立刻联系其他朋友看看谁有空出来玩", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"立刻联系其\"}" },
    { text: "觉得浪费时间，不如回家看书/加班", scores: "{\"rhythm\":2,\"env\":0,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"觉得浪费时\"}" },
    { text: "一个人也要去打卡本来想去的精致餐厅", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"一个人也要\"}" }
  ]},
  { order: 5, text: "你手机里的 App 排列习惯是：", testId: 'city-personality', options: [
    { text: "严格分类，按照效率和功能放进不同文件夹", scores: "{\"rhythm\":2,\"env\":0,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"严格分类，\"}" },
    { text: "比较随意，常用的在主页就行", scores: "{\"rhythm\":-2,\"env\":0,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"比较随意，\"}" },
    { text: "追求美观，甚至会为了壁纸换图标颜色", scores: "{\"rhythm\":0,\"env\":2,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"追求美观，\"}" },
    { text: "删掉了很多社交软件，极简为主", scores: "{\"rhythm\":0,\"env\":-1,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"删掉了很多\"}" }
  ]},
  { order: 6, text: "你在朋友圈发动态的频率是：", testId: 'city-personality', options: [
    { text: "几乎不发，或者设置了仅三天可见", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"几乎不发，\"}" },
    { text: "每天都在分享生活、段子或者好吃的", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":2,\"taste\":1,\"billName\":\"每天都在分\"}" },
    { text: "精心修图，文案考究，展示最好的状态", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"精心修图，\"}" },
    { text: "大多是转发行业文章或自己的成就", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"大多是转发\"}" }
  ]},
  { order: 7, text: "晚上 11 点，你通常在干什么？", testId: 'city-personality', options: [
    { text: "夜生活才刚刚开始，在外面嗨或者吃夜宵", scores: "{\"rhythm\":0,\"env\":1,\"temp\":0,\"social\":2,\"taste\":2,\"billName\":\"夜生活才刚\"}" },
    { text: "还在电脑前敲字/复盘今天的待办事项", scores: "{\"rhythm\":2,\"env\":0,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"还在电脑前\"}" },
    { text: "敷着面膜看剧或者做些精致的睡前护肤", scores: "{\"rhythm\":0,\"env\":2,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"敷着面膜看\"}" },
    { text: "早就躺在床上听着白噪音准备入睡了", scores: "{\"rhythm\":-2,\"env\":-1,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"早就躺在床\"}" }
  ]},
  { order: 8, text: "你对\"搞钱\"的态度是：", testId: 'city-personality', options: [
    { text: "人生第一要义，没有钱就没有安全感", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"人生第一要\"}" },
    { text: "够花就行，不想为了赚钱牺牲所有的生活", scores: "{\"rhythm\":-2,\"env\":-1,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"够花就行，\"}" },
    { text: "赚钱是为了更好体验世界，最好边玩边赚", scores: "{\"rhythm\":1,\"env\":1,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"赚钱是为了\"}" },
    { text: "金钱只是数字，内心的平静更重要", scores: "{\"rhythm\":-1,\"env\":-2,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"金钱只是数\"}" }
  ]},
  { order: 9, text: "如果在路上碰到流浪猫，你一般会：", testId: 'city-personality', options: [
    { text: "蹲下来温柔地跟它说话，甚至去买根火腿肠", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"蹲下来温柔\"}" },
    { text: "觉得很可爱，但因为赶时间只能匆匆走过", scores: "{\"rhythm\":2,\"env\":0,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"觉得很可爱\"}" },
    { text: "远远拍张照，不想靠太近", scores: "{\"rhythm\":0,\"env\":1,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"远远拍张照\"}" },
    { text: "完全不会注意到", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"完全不会注\"}" }
  ]},
  { order: 10, text: "看到身边的同龄人突然暴富或取得大成就，你会：", testId: 'city-personality', options: [
    { text: "产生巨大压力，暗自下决心要更努力", scores: "{\"rhythm\":2,\"env\":0,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"产生巨大压\"}" },
    { text: "真心祝福，然后继续过自己快乐的小日子", scores: "{\"rhythm\":-2,\"env\":0,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"真心祝福，\"}" },
    { text: "觉得每个人都有自己的节奏，不羡慕", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"觉得每个人\"}" },
    { text: "赶紧去请教经验，看看能不能带带自己", scores: "{\"rhythm\":1,\"env\":0,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"赶紧去请教\"}" }
  ]},
  { order: 11, text: "买衣服时，你最看重的是什么？", testId: 'city-personality', options: [
    { text: "品牌、剪裁、质感，必须能体现品味", scores: "{\"rhythm\":0,\"env\":2,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"品牌、剪裁\"}" },
    { text: "舒适、宽松，纯棉或亚麻材质最好", scores: "{\"rhythm\":-2,\"env\":-1,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"舒适、宽松\"}" },
    { text: "实用、耐穿，百搭不用费心想搭配", scores: "{\"rhythm\":1,\"env\":0,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"实用、耐穿\"}" },
    { text: "颜色鲜艳、个性十足，能展现自己的独特", scores: "{\"rhythm\":0,\"env\":1,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"颜色鲜艳、\"}" }
  ]},
  { order: 12, text: "你理想中的居住环境是：", testId: 'city-personality', options: [
    { text: "落地窗前能看到繁华夜景的高层公寓", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"落地窗前能\"}" },
    { text: "带个小院子，能种花养狗的平房", scores: "{\"rhythm\":-2,\"env\":-2,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"带个小院子\"}" },
    { text: "周围有很多年轻人的热闹街区，下楼就有吃的", scores: "{\"rhythm\":0,\"env\":1,\"temp\":0,\"social\":2,\"taste\":1,\"billName\":\"周围有很多\"}" },
    { text: "人烟稀少、推窗见雪山或森林的小木屋", scores: "{\"rhythm\":-1,\"env\":-2,\"temp\":-2,\"social\":-2,\"taste\":0,\"billName\":\"人烟稀少、\"}" }
  ]},
  { order: 13, text: "谈恋爱时，你更倾向于哪种相处模式？", testId: 'city-personality', options: [
    { text: "势均力敌，两个人一起努力变得更优秀", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"势均力敌，\"}" },
    { text: "腻在一起，一起去吃遍大街小巷", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":2,\"taste\":2,\"billName\":\"腻在一起，\"}" },
    { text: "灵魂共鸣，能一起坐在海边谈论宇宙", scores: "{\"rhythm\":-1,\"env\":-2,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"灵魂共鸣，\"}" },
    { text: "细水长流，互相陪伴的平淡日常", scores: "{\"rhythm\":-2,\"env\":0,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"细水长流，\"}" }
  ]},
  { order: 14, text: "关于饮食，你的偏好是：", testId: 'city-personality', options: [
    { text: "无辣不欢，越重口味越刺激越好", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":1,\"taste\":2,\"billName\":\"无辣不欢，\"}" },
    { text: "喜欢去环境极佳的Bistro，喝点小酒", scores: "{\"rhythm\":0,\"env\":2,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"喜欢去环境\"}" },
    { text: "为了效率，随便吃点轻食或者快餐", scores: "{\"rhythm\":2,\"env\":0,\"temp\":0,\"social\":-1,\"taste\":-1,\"billName\":\"为了效率，\"}" },
    { text: "偏爱原汁原味，清淡养生的食物", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":0,\"social\":0,\"taste\":-2,\"billName\":\"偏爱原汁原\"}" }
  ]},
  { order: 15, text: "当你做了一个梦，醒来你会：", testId: 'city-personality', options: [
    { text: "觉得梦境有某种预示，会去查解梦", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"觉得梦境有\"}" },
    { text: "觉得梦是情绪的出口，写在备忘录里", scores: "{\"rhythm\":-1,\"env\":-1,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"觉得梦是情\"}" },
    { text: "转头就忘了，赶紧起床赶地铁", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"转头就忘了\"}" },
    { text: "如果梦很好玩，马上发消息跟朋友吐槽", scores: "{\"rhythm\":0,\"env\":0,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"如果梦很好\"}" }
  ]},
  { order: 16, text: "对于\"说走就走的旅行\"，你的看法是：", testId: 'city-personality', options: [
    { text: "太棒了！马上买票，不做攻略直接冲", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":0,\"social\":2,\"taste\":0,\"billName\":\"太棒了！马\"}" },
    { text: "不行，必须做好详细的Excel行程表才安心", scores: "{\"rhythm\":2,\"env\":0,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"不行，必须\"}" },
    { text: "如果有人带着我就去，我懒得操心", scores: "{\"rhythm\":-2,\"env\":0,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"如果有人带\"}" },
    { text: "更喜欢去没人认识的地方流浪", scores: "{\"rhythm\":0,\"env\":-2,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"更喜欢去没\"}" }
  ]},
  { order: 17, text: "你觉得自己的情感状态通常是：", testId: 'city-personality', options: [
    { text: "像一团火，情绪起伏大，热烈而直接", scores: "{\"rhythm\":0,\"env\":0,\"temp\":1,\"social\":2,\"taste\":1,\"billName\":\"像一团火，\"}" },
    { text: "像一块冰，外表冷漠，很难让人走进内心", scores: "{\"rhythm\":0,\"env\":0,\"temp\":-2,\"social\":-2,\"taste\":0,\"billName\":\"像一块冰，\"}" },
    { text: "像一杯温水，平和包容，波澜不惊", scores: "{\"rhythm\":-2,\"env\":0,\"temp\":1,\"social\":0,\"taste\":-1,\"billName\":\"像一杯温水\"}" },
    { text: "像一杯气泡水，外表光鲜，内在不断涌动", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"像一杯气泡\"}" }
  ]},
  { order: 18, text: "如果有两个工作机会，你会选：", testId: 'city-personality', options: [
    { text: "薪水极高，但几乎没有私人时间", scores: "{\"rhythm\":2,\"env\":1,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"薪水极高，\"}" },
    { text: "薪水一般，但朝九晚五，离家近", scores: "{\"rhythm\":-2,\"env\":0,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"薪水一般，\"}" },
    { text: "平台非常好，出入高级写字楼", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":1,\"taste\":0,\"billName\":\"平台非常好\"}" },
    { text: "自由职业，虽然不稳定但不受约束", scores: "{\"rhythm\":-1,\"env\":-2,\"temp\":0,\"social\":-2,\"taste\":0,\"billName\":\"自由职业，\"}" }
  ]},
  { order: 19, text: "你更喜欢哪种天气？", testId: 'city-personality', options: [
    { text: "阴雨天，适合窝在被子里听雨", scores: "{\"rhythm\":-1,\"env\":0,\"temp\":-1,\"social\":-2,\"taste\":0,\"billName\":\"阴雨天，适\"}" },
    { text: "晴空万里，阳光热烈", scores: "{\"rhythm\":0,\"env\":0,\"temp\":2,\"social\":1,\"taste\":0,\"billName\":\"晴空万里，\"}" },
    { text: "鹅毛大雪，世界被完全覆盖", scores: "{\"rhythm\":0,\"env\":-2,\"temp\":-2,\"social\":-1,\"taste\":0,\"billName\":\"鹅毛大雪，\"}" },
    { text: "无所谓天气，只要室内有空调就行", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":0,\"taste\":0,\"billName\":\"无所谓天气\"}" }
  ]},
  { order: 20, text: "在这个世界的某个角落，你觉得最吸引你的声音是：", testId: 'city-personality', options: [
    { text: "咖啡馆里的爵士乐和敲击键盘的声音", scores: "{\"rhythm\":1,\"env\":2,\"temp\":0,\"social\":-1,\"taste\":0,\"billName\":\"咖啡馆里的\"}" },
    { text: "凌晨小吃摊上的烟火声和朋友的碰杯声", scores: "{\"rhythm\":0,\"env\":1,\"temp\":0,\"social\":2,\"taste\":2,\"billName\":\"凌晨小吃摊\"}" },
    { text: "寺庙悠远的钟声和诵经声", scores: "{\"rhythm\":-2,\"env\":-1,\"temp\":0,\"social\":-2,\"taste\":-1,\"billName\":\"寺庙悠远的\"}" },
    { text: "风吹过树林和雪落下的声音", scores: "{\"rhythm\":-1,\"env\":-2,\"temp\":-1,\"social\":-2,\"taste\":0,\"billName\":\"风吹过树林\"}" }
  ]},
];

// 情绪测试弹幕内容（从本地 SQLite 恢复）
const EMO_DANMAKU = "{\"low\":[\"这也太酷了吧！\",\"羡慕这种精神状态\",\"如何拥有这种顶级钝感力？\",\"本内耗王者实名羡慕了\",\"只要我没素质，素质就绑架不了我\"],\"bnd\":[\"确实，内耗太费精力了\",\"精准命中我的生活哲学\",\"只要我跑得快，内耗就追不上我\",\"这小票打印得没毛病\",\"真实，守住自己的能量才是王道\"],\"sen\":[\"是谁在监视我？\",\"特定触发破防太真实了\",\"平时稳如老狗，一触雷就炸\",\"装死第一名就是我\",\"薛定谔的敏感，简直为我量身定制\"],\"pls\":[\"啊啊啊这就是我！\",\"每次答应完就后悔，说的就是我\",\"讨好型人格破大防了\",\"看这个小票直接看哭了\",\"救命，怎么才能学会拒绝啊\"],\"rum\":[\"深夜批斗会VIP会员在此\",\"原来大家睡前都在复盘啊\",\"别骂了别骂了，已经在抠脚趾了\",\"白天笑嘻嘻，晚上全网黑历史首播\",\"过于真实，引起不适\"],\"sen_pls\":[\"本海绵精快被吸干了\",\"极度共情真的好累\",\"别再给我倒苦水了啊啊啊\",\"看到这句话直接泪奔\",\"感觉每天都在为别人活着\"],\"high\":[\"脑补王者就是我\",\"这账单数字简直惊心动魄\",\"每天在心里演完了一整部甄嬛传\",\"救救孩子吧，太累了\",\"这就是我为什么周末只想躺着\"],\"rum_low_bnd\":[\"破防了，为什么要这么残忍地戳穿我\",\"对自己最狠的人原来是我自己\",\"不敢看第二遍的测试\",\"原来内伤都是我自己打的\",\"抱抱自己吧，真的太难了\"]}";

const CITY_DANMAKU = "{\"industrial\":[\"这城市简直为我量身定做\",\"就是喜欢这种效率至上的感觉\",\"搞钱搞钱，工作使我快乐\",\"打工人不睡觉\",\"高楼大厦才是我真正的归宿\"],\"cyber\":[\"太酷了吧这赛博朋克感\",\"我就是夜行动物\",\"越夜越美丽\",\"这就是我的主场\",\"简直是我的精神故乡\"],\"wabisabi\":[\"慢下来才能体会生活\",\"岁月静好才是真的好\",\"喜欢这种历史沉淀的感觉\",\"一壶茶一坐就是一下午\",\"这就是我想要的退休生活\"],\"nature\":[\"果然我应该去没有天花板的地方\",\"旷野才是我的归属\",\"看着这个结果觉得好治愈\",\"不想卷了，带我走吧\",\"逃离钢铁森林成功\"],\"ocean\":[\"想去海边吹风了\",\"极度浪漫说的是我没错了\",\"好想去海边躺平啊\",\"生活就是一场微醺\",\"看到这片海就觉得很放松\"]}";

export async function GET() {
  const log: string[] = [];
  try {
    // --- 1. 修复情绪测试弹幕 ---
    const emoConfig = await prisma.globalConfig.findFirst({ where: { testId: 'emotional-friction' } });
    if (emoConfig) {
      await prisma.globalConfig.update({
        where: { id: emoConfig.id },
        data: { danmakuContent: EMO_DANMAKU }
      });
      log.push('✅ 情绪测试弹幕已恢复');
    }

    // --- 2. 清理多余的城市题目（保留已有的2题，先删除再重建）---
    const existingCityCount = await prisma.question.count({ where: { testId: 'city-personality' } });
    log.push(`ℹ️ 当前城市题数量: ${existingCityCount}`);

    // Force reseed if not exactly 20
    if (existingCityCount !== 20) {
      // 删除已有的不完整城市题目
      const existingIds = await prisma.question.findMany({
        where: { testId: 'city-personality' },
        select: { id: true }
      });
      for (const { id } of existingIds) {
        await prisma.option.deleteMany({ where: { questionId: id } });
        await prisma.question.delete({ where: { id } });
      }
      log.push(`🗑️ 已清理 ${existingIds.length} 道不完整城市题`);

      // 逐题写入
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
      log.push(`✅ ${CITY_QUESTIONS.length} 道城市题已写入`);
    } else {
      log.push(`✅ 城市题数量已正常 (${existingCityCount} 道)，跳过`);
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

    return NextResponse.json({ success: true, message: '修复完成！', log });
  } catch (error: any) {
    console.error('seed-city error:', error);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  }
}
