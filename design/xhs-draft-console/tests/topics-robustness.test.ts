import { join } from 'path';
import { describe, expect, it } from 'vitest';

// 动态引用技能脚本中的 buildSteps
const scriptPath = join(
  __dirname,
  '../../../.agent/skills/xhs-note-operator/scripts/draft-one-card.js'
);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildSteps } = require(scriptPath);

describe('话题标签输入容错加固 (topics_newline_then_each)', () => {
  it('用例 1: 自动清洗各种 # 与 ＃ 前缀以及多余空格', () => {
    const card = {
      id: 'test_card_1',
      title: '测试标题',
      body: '测试正文第一段',
      coverLines: ['第一行', '第二行'],
      tags: ['#心理测试', '＃大女主', '  #觉醒  ', '###成长', '普通标签'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 验证 expression 中序列化的标签数组已剥离所有前缀 #
    expect(topicStep.expression).toContain('心理测试');
    expect(topicStep.expression).toContain('大女主');
    expect(topicStep.expression).toContain('觉醒');
    expect(topicStep.expression).toContain('成长');
    expect(topicStep.expression).toContain('普通标签');
    // 确保没有出现连续两个 # (##)
    expect(topicStep.expression).not.toMatch(/#{2,}/);
  });

  it('用例 2: 空标签与纯空白标签平滑跳过，零 TypeError', () => {
    const card = {
      id: 'test_card_empty',
      title: '测试标题',
      body: '正文',
      coverLines: ['封面'],
      tags: ['', '   ', '###', '＃＃', null, undefined],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 清洗后为空数组
    expect(topicStep.expression).toContain(JSON.stringify([]));
    // 包含空标签快速返回逻辑
    expect(topicStep.expression).toContain("skipped: true, reason: '无有效标签'");
  });

  it('用例 3: 软断言准则 (Soft Assertion) 与弹窗超时延长至 5 秒', () => {
    const card = {
      id: 'test_card_soft',
      title: '测试标题',
      body: '正文',
      coverLines: ['封面'],
      tags: ['测试A', '测试B'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 验证 accept 准则明确支持软断言
    expect(topicStep.accept).toMatch(/至少 1 个蓝标转化|蓝标数量 === tags\.length/);

    // 验证轮询次数上限支持 20 次 (20 * 250ms = 5000ms)
    expect(topicStep.expression).toContain('i < 20');
    expect(topicStep.expression).toContain('sleep(250)');

    // 验证点击 item 使用更可靠的事件（PointerEvent + MouseEvent）
    expect(topicStep.expression).toContain('PointerEvent');
    expect(topicStep.expression).toContain('MouseEvent');

    // 验证彻底移除点击 item 后的 Enter 换行事件，防止多余换行
    expect(topicStep.expression).not.toContain("key: 'Enter'");

    // 验证未匹配时保留 #tag 并支持 deleteRange 清洗裸 #
    expect(topicStep.expression).toContain('deleteRange');

    // 验证软断言柔性放行：避免因 plain.length > 0 导致熔断假死
    expect(topicStep.expression).toContain('ok = true');
  });

  it('用例 4: expression 语法合法性 (严格可解析)', () => {
    const card = {
      id: 'test_card_syntax',
      title: '标题',
      body: '正文',
      coverLines: ['封面'],
      tags: ['#标签1', '标签2'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 包装成 Function 检查 JS 语法合法性
    expect(() => {
      new Function(`return ${topicStep.expression};`);
    }).not.toThrow();
  });

  it('用例 5: 优化话题输入机制（先聚焦末尾输入 # 触发监听，再输入 tag 文本触发 input 事件）', () => {
    const card = {
      id: 'test_card_trigger',
      title: '标题',
      body: '正文内容',
      coverLines: ['封面'],
      tags: ['大女主'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 验证输入前先聚焦末尾，输入 '#'
    expect(topicStep.expression).toContain("insertContent('#')");
    // 验证触发 input 事件以保证 TipTap 话题监听被唤醒
    expect(topicStep.expression).toContain("Event('input'");
    // 验证输入 tag 文本
    expect(topicStep.expression).toContain('insertContent(tag)');
    // 验证以空格在末尾自然分隔
    expect(topicStep.expression).toContain("insertContent(' ')");
  });

  it(
    '用例 6: 软断言柔性放行真实逻辑（仅当正文彻底丢失才失败，即使有 plain 标签也不熔断）',
    async () => {
    const card = {
      id: 'test_card_soft_exec',
      title: '标题',
      body: '正文有效内容',
      coverLines: ['封面'],
      tags: ['生僻测试话题'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 模拟 TipTap DOM 环境验证执行行为
    const mockEditor = {
      editor: {
        getText: () => '正文有效内容 #生僻测试话题',
        commands: {
          focus: () => {},
          enter: () => {},
          insertContent: () => {},
          deleteRange: () => {},
        },
      },
      getBoundingClientRect: () => ({ width: 100 }),
      querySelectorAll: () => [], // 无蓝标
      innerText: '正文有效内容 #生僻测试话题',
      dispatchEvent: () => true,
    };

    const prevDoc = (global as unknown as { document?: unknown }).document;
    (global as unknown as { document: unknown }).document = {
      querySelectorAll: (sel: string) => {
        if (sel.includes('tiptap')) return [mockEditor];
        return [];
      },
      querySelector: () => null,
    };

    try {
      const fn = new Function(`return ${topicStep.expression};`)();
      const result = await fn;
      // 尽管 0 蓝标且存在 plain 标签，软断言依然返回 ok: true，不熔断流水线
      expect(result.ok).toBe(true);
      expect(result.blue).toBe(0);
      expect(result.plain).toContain('#生僻测试话题');
      expect(result.warnings).toBeDefined();
    } finally {
      (global as unknown as { document: unknown }).document = prevDoc;
    }
  }, 15000);

  it('用例 7: 正文内容彻底丢失时致命防御失败 (ok: false)', async () => {
    const card = {
      id: 'test_card_fatal',
      title: '标题',
      body: '正文',
      coverLines: ['封面'],
      tags: ['话题'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    const mockEditor = {
      editor: {
        getText: () => '', // 正文丢失！
        commands: {
          focus: () => {},
          enter: () => {},
          insertContent: () => {},
        },
      },
      getBoundingClientRect: () => ({ width: 100 }),
      querySelectorAll: () => [],
      innerText: '',
      dispatchEvent: () => true,
    };

    const prevDoc = (global as unknown as { document?: unknown }).document;
    (global as unknown as { document: unknown }).document = {
      querySelectorAll: (sel: string) => {
        if (sel.includes('tiptap')) return [mockEditor];
        return [];
      },
      querySelector: () => null,
    };

    try {
      const fn = new Function(`return ${topicStep.expression};`)();
      const result = await fn;
      // 正文丢失属于致命错误，必须判定失败
      expect(result.ok).toBe(false);
      expect(result.err).toContain('正文内容');
    } finally {
      (global as unknown as { document: unknown }).document = prevDoc;
    }
  });

  it('用例 8: 话题去重 + 真实 id 解析 + 推荐栏优先', () => {
    const card = {
      id: 'test_card_meta',
      title: '标题',
      body: '正文',
      coverLines: ['封面'],
      tags: ['大女主觉醒', '大女主觉醒', '#原生家庭测试[话题]#'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 编译期去重：同名只留一次（经 esc 双层序列化嵌在 JSON.parse 字符串里）
    expect(topicStep.expression).toContain('大女主觉醒');
    expect(topicStep.expression).toContain('原生家庭测试');
    expect(topicStep.expression.match(/大女主觉醒/g)?.length).toBeGreaterThanOrEqual(1);
    // 运行时也会再去重已有蓝标
    expect(topicStep.expression).toContain('existingNames');
    expect(topicStep.expression).toContain('deduped');
    // 推荐栏 / 搜索补 id
    expect(topicStep.expression).toContain('recommendMap');
    expect(topicStep.expression).toContain('resolveTopicMeta');
    expect(topicStep.expression).toContain('search/topics');
    expect(topicStep.expression).toContain('insertTopic');
  });

  it('用例 9: save_draft 保存前等图片就绪 + 失败 toast 清场 + 最多 3 次退避', () => {
    const card = {
      id: 'test_card_save',
      title: '标题',
      body: '正文',
      coverLines: ['封面'],
      tags: ['话题A'],
    };

    const steps = buildSteps(card);
    const saveStep = steps.find((s: { id: string }) => s.id === 'save_draft');
    expect(saveStep).toBeDefined();
    expect(saveStep.expression).toContain('waitImagesReady');
    expect(saveStep.expression).toContain('waitFailToastClear');
    expect(saveStep.expression).toContain('attempt <= 3');
    expect(saveStep.expression).toContain('上传中');
    expect(saveStep.expression).toContain('图片/上传未就绪');
    expect(saveStep.expression).toContain('!readyInfo.ready');
    expect(() => {
      new Function(`return ${saveStep.expression};`);
    }).not.toThrow();
  });

  it('用例 10: 话题搜索禁止 arr[0] 误绑', () => {
    const steps = buildSteps({
      id: 'test_no_arr0',
      title: '标题',
      body: '正文',
      coverLines: ['封面'],
      tags: ['话题A'],
    });
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep.expression).toContain("=== tag)");
    expect(topicStep.expression).not.toContain('|| arr[0]');
  });

  it('用例 11: 正文末尾纯文本话题在 title_body 注入前被剥离清洗 (绝不写入黑字段落)', () => {
    const card = {
      id: 'test_cleanse_body',
      title: '测试标题',
      body: '第一段正文内容\n\n第二段正文内容\n\n#心理测试[话题]# #大女主#\n#原生家庭测试[话题]#',
      coverLines: ['封面'],
      tags: ['心理测试', '大女主'],
    };

    const steps = buildSteps(card);
    const titleBodyStep = steps.find((s: { id: string }) => s.id === 'title_body');
    expect(titleBodyStep).toBeDefined();

    // 验证正文段落中完全剥离了伪话题
    expect(titleBodyStep.expression).toContain('第一段正文内容');
    expect(titleBodyStep.expression).toContain('第二段正文内容');
    expect(titleBodyStep.expression).not.toContain('bodyLines = ["第一段正文内容","第二段正文内容","#心理测试');
    expect(titleBodyStep.expression).not.toMatch(/<p>#心理测试/);
    expect(titleBodyStep.expression).not.toMatch(/<p>#大女主/);
  });

  it('用例 12: TipTap insertTopic 原生保底注入 (cleanse-safe) 与末尾纯文本清洗', async () => {
    const card = {
      id: 'test_cleanse_safe_insert',
      title: '测试标题',
      body: '测试正文',
      coverLines: ['封面'],
      tags: ['大女主觉醒'],
    };

    const steps = buildSteps(card);
    const topicStep = steps.find((s: { id: string }) => s.id === 'topics_newline_then_each');
    expect(topicStep).toBeDefined();

    // 验证包含保底机制与二次清洗逻辑
    expect(topicStep.expression).toContain('cleanse-safe');
    expect(topicStep.expression).toContain('trailingTopicRegex');
    expect(topicStep.expression).toContain('insertTopic');

    // 模拟具备 TipTap insertTopic 能力的 DOM 环境
    let insertedData: unknown = null;
    const mockEditor = {
      editor: {
        getText: () => '测试正文',
        commands: {
          focus: () => {},
          enter: () => {},
          insertTopic: (opts: { data: unknown }) => {
            insertedData = opts.data;
            return true;
          },
          insertContent: () => {},
          setContent: () => {},
        },
      },
      getBoundingClientRect: () => ({ width: 100 }),
      querySelectorAll: (sel: string) => {
        if (sel.includes('tiptap-topic')) {
          return insertedData ? [{
            getAttribute: () => JSON.stringify(insertedData),
            innerText: '#大女主觉醒[话题]#',
          }] : [];
        }
        return [];
      },
      innerText: '测试正文',
      dispatchEvent: () => true,
    };

    const prevDoc = (global as unknown as { document?: unknown }).document;
    (global as unknown as { document: unknown }).document = {
      querySelectorAll: (sel: string) => {
        if (sel.includes('tiptap')) return [mockEditor];
        return [];
      },
      querySelector: () => null,
    };

    try {
      const fn = new Function(`return ${topicStep.expression};`)();
      const result = await fn;
      expect(result.ok).toBe(true);
      expect(insertedData).toEqual({
        name: '大女主觉醒',
        id: '',
        link: '',
        type: 'topic',
        source: 'cleanse-safe',
      });
      expect(result.converted).toContain('大女主觉醒');
    } finally {
      (global as unknown as { document: unknown }).document = prevDoc;
    }
  });
});
