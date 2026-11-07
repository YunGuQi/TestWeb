/**
 * 服务端真脱敏模块（全域单一真源）
 * 物理剔除后 70% 深度付费字段，仅吐出前 30% 身份定调与量化诱饵
 * 彻底封死前端 F12 删除遮罩 DOM 节点或抓包白嫖漏洞
 */
export function stripPremiumContent(finalResult: any, testId: string): any {
  if (!finalResult || typeof finalResult !== 'object') return finalResult;
  const safeResult = { ...finalResult };

  switch (testId) {
    case 'emotional-friction':
    case 'emo':
      delete safeResult.quote;
      delete safeResult.scenarios;
      delete safeResult.vampires;
      delete safeResult.bestMatch;
      delete safeResult.hiddenCosts;
      delete safeResult.adviceList;
      break;

    case 'destiny-lover':
      delete safeResult.firstMeet;
      delete safeResult.redFlags;
      delete safeResult.loveAdvice;
      break;

    case 'love-species':
      delete safeResult.behavior;
      delete safeResult.redFlag;
      delete safeResult.careGuide;
      delete safeResult.breakdownScenes;
      delete safeResult.hiddenCost;
      delete safeResult.selfCureGuide;
      delete safeResult.toxicScenario;
      delete safeResult.bestMatch;
      delete safeResult.toxicMatch;
      break;

    case 'family-origin':
      delete safeResult.childhoodMark;
      delete safeResult.triggers;
      delete safeResult.antidoteList;
      break;

    case 'city':
    case 'city-personality':
      delete safeResult.schedule;
      delete safeResult.curePrescription;
      delete safeResult.toxicCity;
      break;

    default:
      break;
  }

  return safeResult;
}
