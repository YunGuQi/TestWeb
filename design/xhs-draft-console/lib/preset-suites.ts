/**
 * 预置测试用例与业务产品目录元数据定义
 * 提供 5 套产品的预置文案与切片目录，供控制台一键点选，免去繁琐的手动输入
 */
export interface ProductPresetItem {
  id: string;
  name: string;
  category: string;
  mdPath: string;
  cardsDir: string;
}

export const PRODUCT_PRESETS: ProductPresetItem[] = [
  {
    id: 'dnvzhu_fixture',
    name: '★ 方案A 3卡可跑样例 (本地联调)',
    category: '联调样例',
    mdPath:
      'E:/AI/Antigravity/小红书/.scratch/xhs-draft-autofill/fixtures/dnvzhu-compliant-3cards.md',
    cardsDir:
      'E:/AI/Antigravity/小红书/.scratch/xhs-draft-autofill/fixtures/cards',
  },
  {
    id: 'dnvzhu_real',
    name: '大女主觉醒测试 · 2026-10-10 发帖文案',
    category: '大女主',
    mdPath:
      'E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/docs/2026-10-10_发帖文案.md',
    cardsDir:
      'E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/assets/结果测试截图/cards',
  },
  {
    id: 'dnvzhu_1028',
    name: '大女主觉醒测试 · 2026-10-28 发帖文案',
    category: '大女主',
    mdPath:
      'E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/docs/2026-10-28_发帖文案.md',
    cardsDir:
      'E:/AI/Antigravity/小红书/design/product-docs/大女主觉醒测试/assets/结果测试截图/cards',
  },
  {
    id: 'destiny_lover',
    name: '命定恋人 · 结果测试截图 cards 目录',
    category: '命定恋人',
    mdPath: '',
    cardsDir:
      'E:/AI/Antigravity/小红书/design/product-docs/命定恋人/assets/结果测试截图/cards',
  },
  {
    id: 'emo',
    name: '深度情绪内耗 · 结果测试截图 cards 目录',
    category: '深度情绪内耗',
    mdPath: '',
    cardsDir:
      'E:/AI/Antigravity/小红书/design/product-docs/深度情绪内耗/assets/结果测试截图/cards',
  },
  {
    id: 'love_species',
    name: '恋爱物种领养中心 · 结果测试截图 cards 目录',
    category: '恋爱物种',
    mdPath: '',
    cardsDir:
      'E:/AI/Antigravity/小红书/design/product-docs/恋爱物种领养中心/assets/结果测试截图/cards',
  },
  {
    id: 'city',
    name: '性格城市匹配 · 结果测试截图 cards 目录',
    category: '性格城市',
    mdPath: '',
    cardsDir:
      'E:/AI/Antigravity/小红书/design/product-docs/性格城市匹配/assets/结果测试截图/cards',
  },
];
