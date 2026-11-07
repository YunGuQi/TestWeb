async function testE2E() {
  console.log('--- 1. 获取题目列表 ---');
  const qRes = await fetch('http://localhost:3000/api/questions?testId=family-origin');
  const qData = await qRes.json();
  console.log(`获取到题目数量: ${qData.questions?.length}`);
  if (!qData.questions || qData.questions.length !== 15) {
    throw new Error('题目数量不为 15');
  }

  // 模拟全卷作答（选择各题第 1 项）
  const answers = qData.questions.map((q: any) => ({
    questionId: q.id,
    optionId: q.options[0].id
  }));

  console.log('\n--- 2. 提交答案并计算结果 ---');
  const sRes = await fetch('http://localhost:3000/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: 'family-origin',
      answers,
      metadata: { nickname: '安安' }
    })
  });
  const sData = await sRes.json();
  console.log('提交结果响应状态:', sRes.status);
  console.log('结果数据:');
  console.log(`  ID: ${sData.result?.id}`);
  console.log(`  名称: ${sData.result?.name}`);
  console.log(`  副标题: ${sData.result?.subtitle}`);
  console.log(`  依恋类型: ${sData.result?.attachmentType}`);
  console.log(`  雷达专属指标:`, sData.result?.radar);
  console.log(`  深度切片 - 童年烙印: ${sData.result?.childhoodMark?.slice(0, 35)}...`);
  console.log(`  深度切片 - 应激触发点:`, sData.result?.triggers);
  console.log(`  深度切片 - 处方:`, sData.result?.antidoteList);
  console.log(`  金句: ${sData.result?.quote}`);

  if (sData.result?.id === 'r1' && sData.result?.radar?.length === 3) {
    console.log('\n🎉 端到端 API 与计算引擎联调走查 100% 成功！');
  } else {
    throw new Error('结果数据不匹配预期');
  }
}

testE2E().catch(e => {
  console.error('测试失败:', e);
  process.exit(1);
});
