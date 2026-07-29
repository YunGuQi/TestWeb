import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { questions, results } from '../../../lib/data';
import { destinyLoverQuestions, destinyLoverResults } from '../../../lib/destiny-lover-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, answers, testId = 'emotional-friction' } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ success: false, error: '无有效答案数据' }, { status: 400 });
    }

    // 1. 提取选项 ID 列表
    const optionIds: string[] = Object.values(answers).map((v: any) => {
      if (typeof v === 'string' || typeof v === 'number') return v.toString();
      return v?.id?.toString();
    }).filter(Boolean);

    // ==== 命运恋人独立算分分支 ====
    if (testId === 'destiny-lover') {
      let L = 0, G = 0, D = 0, S = 0, A = 0, C = 0, R = 0, P = 0;
      
      // 遍历所有题目和选项进行算分
      destinyLoverQuestions.forEach(q => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            L += opt.scores.L;
            G += opt.scores.G;
            D += opt.scores.D;
            S += opt.scores.S;
            A += opt.scores.A;
            C += opt.scores.C;
            R += opt.scores.R;
            P += opt.scores.P;
          }
        });
      });

      // 计算四个维度的胜出者组合
      const dim1 = L >= G ? 'l' : 'g';
      const dim2 = D >= S ? 'd' : 's';
      const dim3 = A >= C ? 'a' : 'c';
      const dim4 = R >= P ? 'r' : 'p';
      const userCombo = dim1 + dim2 + dim3 + dim4; // 例如 "ldar"

      // 寻找最匹配的结果
      let bestMatch = destinyLoverResults[0];
      let maxMatchCount = -1;

      for (const res of destinyLoverResults) {
        let matchCount = 0;
        const resKey = res.key.split('_')[0]; // 处理 gscp_pure
        for (let i = 0; i < 4; i++) {
          if (resKey[i] && userCombo[i] && resKey[i] === userCombo[i]) {
            matchCount++;
          }
        }
        if (matchCount > maxMatchCount) {
          maxMatchCount = matchCount;
          bestMatch = res;
        }
      }

      // 动态注入称呼与状态微调
      const nickname = body.metadata?.nickname || '你';
      const userStatus = body.metadata?.status || 'single';
      
      let finalDesc = bestMatch.description.replace(/{name}/g, nickname);
      if (userStatus === 'dating') {
        finalDesc = finalDesc.replace(/你的命定恋人/g, '你现在的另一半(如果是命定的话)');
      }

      const finalResult = {
        id: bestMatch.id,
        key: bestMatch.key,
        title: bestMatch.title,
        subtitle: bestMatch.subtitle,
        tags: bestMatch.tags,
        description: finalDesc,
        quote: bestMatch.quote,
        radar: bestMatch.radar, // 返回雷达图数据
        rawScores: { L, G, D, S, A, C, R, P, userCombo }
      };

      let recordId: string | number = 1;
      try {
        const record = await prisma.testRecord.create({
          data: {
            testId,
            deviceId: deviceId || 'unknown',
            answers: JSON.stringify(answers),
            resultId: 1 // 简化记录，实际可存字典表 ID
          }
        });
        recordId = record.id;
      } catch (dbErr) {
        console.warn('DB connect failed during testRecord create. Gracefully continuing.');
      }

      return NextResponse.json({
        success: true,
        recordId: recordId,
        result: finalResult
      });
    }
    // ==== 原有 emo 算分分支 ====

    let sen = 0, rum = 0, pls = 0, bnd = 0;
    const billItems: Array<{ name: string; cost: number }> = [];

    // 2. 从数据库中查询对应 Option
    const numericIds = optionIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    let dbOptions: any[] = [];
    if (numericIds.length > 0) {
      dbOptions = await prisma.option.findMany({
        where: { id: { in: numericIds } }
      });
    }

    if (dbOptions.length > 0) {
      // 数据库权重算分
      dbOptions.forEach(opt => {
        try {
          const scores = JSON.parse(opt.scores || '{}');
          const senScore = scores.sen || 0;
          const rumScore = scores.rum || 0;
          const plsScore = scores.pls || 0;
          const bndScore = scores.bnd || 0;

          sen += senScore;
          rum += rumScore;
          pls += plsScore;
          bnd += bndScore;

          const cost = (senScore * 300) + (rumScore * 250) + (plsScore * 280);
          if (scores.billName && cost > 0) {
            billItems.push({ name: scores.billName, cost });
          }
        } catch (e) {
          console.error('Error parsing scores:', e);
        }
      });
    } else {
      // 降级兜底：用 lib/data.ts 计算分值
      questions.forEach(q => {
        q.options.forEach(opt => {
          if (optionIds.includes(opt.id.toString())) {
            sen += opt.senScore || 0;
            rum += opt.rumScore || 0;
            pls += opt.plsScore || 0;
            bnd += opt.bndScore || 0;

            const cost = ((opt.senScore || 0) * 300) + ((opt.rumScore || 0) * 250) + ((opt.plsScore || 0) * 280);
            if (opt.billName && cost > 0) {
              billItems.push({ name: opt.billName, cost });
            }
          }
        });
      });
    }

    // 3. 计算 totalFriction
    let totalFriction = (sen * 300) + (rum * 250) + (pls * 280) - (bnd * 100);
    if (totalFriction < 0) totalFriction = 0;

    // 4. 判定 resultKey
    let resultKey = 'bnd'; // default
    const maxVal = Math.max(sen, rum, pls, bnd);

    if (sen >= 35 && rum >= 35 && pls >= 35) {
      resultKey = 'high';
    } else if (sen >= 30 && pls >= 30) {
      resultKey = 'sen_pls';
    } else if (rum >= 40 && bnd <= 10) {
      resultKey = 'rum_low_bnd';
    } else if (bnd >= 40 && sen <= 15) {
      resultKey = 'low';
    } else if (pls === maxVal) {
      resultKey = 'pls';
    } else if (rum === maxVal) {
      resultKey = 'rum';
    } else if (sen === maxVal) {
      resultKey = 'sen';
    } else if (bnd === maxVal) {
      resultKey = 'bnd';
    }

    // 5. 获取具体结论文本
    const fallbackRes = results.find(r => r.key === resultKey) || results[0];
    let resConfig = null;
    try {
      resConfig = await prisma.resultConfig.findFirst({
        where: { condition: resultKey, testId }
      });
    } catch (e) {
      console.warn('DB error reading emo resultConfig, fallback to local data.');
    }

    const finalResult = {
      id: resConfig?.id || 1,
      key: resultKey,
      title: resConfig?.title || fallbackRes.title,
      tags: fallbackRes.tags || '#钝感力王者,#反PUA大师',
      description: resConfig?.desc || fallbackRes.description,
      quote: resConfig?.quote || fallbackRes.quote,
      sen,
      rum,
      pls,
      bnd,
      totalFriction,
      maxScore: 100,
      billItems
    };

    // 6. 持久化存入 TestRecord (断网容灾)
    let recordId: string | number = 1;
    try {
      const record = await prisma.testRecord.create({
        data: {
          testId,
          deviceId: deviceId || 'unknown',
          answers: JSON.stringify(answers),
          resultId: finalResult.id
        }
      });
      recordId = record.id;
    } catch (e) {
      console.warn('DB error creating testRecord, skipping offline.');
    }

    return NextResponse.json({
      success: true,
      recordId: recordId,
      result: finalResult
    });

  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ success: false, error: '提交失败: ' + (error.message || '') }, { status: 500 });
  }
}
