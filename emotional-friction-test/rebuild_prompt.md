# 情绪内耗测试网站 — 完整复现提示词

## 【一句话概述】

创建一个名为"安安心灵自评馆"的单页心理测试 Web App，包含4个页面（入口→答题→结果→详情），主题色为疗愈紫，移动优先，桌面端居中卡片容器，全程无页面跳转（JS切换显示）。

---

## 【技术栈】

- 纯 HTML5 + CSS3 + 原生 JavaScript（无框架）
- 单文件分离：`index.html` + `style.css` + `script.js`
- 字体：系统默认 sans-serif（-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial）
- 图标：Emoji（无需图标库）

---

## 【色彩系统】

```css
:root {
    --bg-color: #F8F5FF;          /* 极淡紫，页面背景 */
    --card-bg: #FFFFFF;           /* 纯白，卡片背景 */
    --text-primary: #4C1D95;      /* 深紫，主文字（替代黑色）*/
    --text-secondary: #7C3AED;    /* 紫灰，次要文字 */
    --accent-color: #8B5CF6;      /* 主题紫，按钮/进度条 */
    --accent-dark: #7C3AED;       /* 深一级，按钮点击态 */
    --accent-light: #E9D8FD;      /* 浅紫，标签/装饰 */
    --border-radius: 16px;
    --box-shadow: 0 8px 24px rgba(139, 92, 246, 0.12);
    --card-border: 1px solid rgba(139, 92, 246, 0.1);
}

/* 页面背景：径向渐变 */
background-image: radial-gradient(circle at 50% 10%, #E9D8FD 0%, #F8F5FF 60%);

/* 桌面端body背景 */
background: #F3E8FF;
```

---

## 【整体布局架构】

### 移动端（< 768px）
- body：正常文档流，背景色渐变
- `.app-container`：max-width 480px，居中，全屏高度，透明背景

### 桌面端（≥ 768px）
- body：flex 居中（水平+垂直）
- `.app-container`：max-width 1000px，width 90%，height 85vh（max 900px），白背景，border-radius 24px，box-shadow `0 20px 60px rgba(109, 40, 217, 0.15)`，overflow: hidden

### 页面切换机制
- 4个 `<section>` 绝对定位叠在一起
- 通过添加/移除 `.active-page` / `.hidden-page` 类控制显隐
- 切换动效：opacity + translateY(20px→0)，时长 0.4s ease

```css
section {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%;
    overflow-y: auto; padding: 24px;
    opacity: 0; pointer-events: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
    transform: translateY(20px);
}
section.active-page {
    opacity: 1; pointer-events: auto; transform: translateY(0); z-index: 10;
}
```

---

## 【页面1：入口页 #landing-page】

### 视觉结构（从上到下，垂直居中）
1. **品牌名** `安安心灵自评馆` — font-size: 20px, color: #7C3AED, letter-spacing: 1px
2. **主标题** `情绪内耗·专业自评测评` — font-size: 28px, bold, color: #4C1D95
3. **副标题胶囊** `10题快速自测 | 即刻生成完整结果报告` — 浅紫背景(#E9D8FD)，圆角20px，color: #6B46C1，padding: 6px 16px
4. **信任卡片**（白底，圆角16px，紫色阴影）：
   - 3列横排，每列：上方✅图标 + 下方文字
   - 文字：「完整结果直达」「无隐藏消费」「全程自助体验」
5. **主按钮** `开始自评` — 全宽，紫色(#8B5CF6)，圆角50px，font-size: 18px，有脉冲动画（pulse-animation）
6. **免责声明** — font-size: 11px，color: #A0AEC0

---

## 【页面2：答题页 #quiz-page】

### 结构
- **顶部进度区**：
  - 进度条：高6px，灰底(#EDF2F7)，紫色填充(#8B5CF6)，宽度随题目动态更新（每题+10%）
  - 进度文字：右对齐，`进度 X/10`
- **题目文字**：font-size: 18px, bold, min-height: 60px
- **4个选项按钮**（JS动态生成）：
  - 白底，border: 1px solid transparent，border-radius: 12px
  - padding: 18px 20px，width: 100%，text-align: left
  - 选中/点击态：背景 #EBF8FF，border-color: #8B5CF6，color: #2C5282

### 10道题目（4选项，分值1-4）
| 题号 | 题目 |
|------|------|
| 1 | 经常因小事反复胡思乱想，难以平复情绪 |
| 2 | 明明未做体力事，却常感身心疲惫、提不起劲 |
| 3 | 过度在意他人的看法，害怕被否定或批评 |
| 4 | 做事前反复纠结，很难快速做出决定 |
| 5 | 独处时容易陷入胡思乱想，情绪低落 |
| 6 | 总觉得心里装着事，无法真正放松下来 |
| 7 | 容易因他人的一句话，影响一整天的心情 |
| 8 | 习惯自我否定，觉得自己不够好 |
| 9 | 睡前容易回想过往事，导致入睡困难 |
| 10 | 面对选择时，总担心做出错误的决定 |

每题选项固定：
- A·完全不符合（1分）
- B·偶尔符合（2分）
- C·比较符合（3分）
- D·完全符合（4分）

选中后300ms延迟自动跳下一题，最后一题跳结果页。

---

## 【页面3：结果页 #result-page】

### 评分逻辑（总分范围10-40）
| 分段 | 分值 | 等级 | 图标 |
|------|------|------|------|
| 轻度内耗 | 10-20 | low | 🍃 |
| 中度内耗 | 21-30 | mid | ☁️ |
| 重度内耗 | 31-40 | high | 🌧️ |

### 结果文案（轻度/中度/重度各一套）

**轻度（🍃 轻度内耗）**
- 描述：你的情绪调节能力尚可，但偶尔会陷入纠结 / 对生活保持着敏感度 / 内心有一片宁静花园
- 建议：每天留10分钟放空时间，不强迫自己思考 / 多去户外走走，记录生活中的小确幸
- 推广文：想更了解自己潜在的优势性格吗？

**中度（☁️ 中度内耗）**
- 描述：你习惯把情绪藏在心里，容易自我消耗 / 对周遭感受敏锐 / 看似平静，内心却一直在反复纠结
- 建议：每天给自己10分钟"断网时间" / 接纳自己的情绪，不必事事追求完美
- 推广文：这种"心累"的感觉，也许与高敏感特质或讨好型人格有关。

**重度（🌧️ 重度内耗）**
- 描述：你的心理能量正在被大量消耗，大脑像无法关机的电脑 / 极度在意他人评价 / 长期处于精神紧绷状态
- 建议：请尝试寻找信任的朋友倾诉，或寻求专业心理咨询师帮助 / 允许自己今天"什么都不做"
- 推广文：了解自己的情绪根源是改变的第一步。

### 页面元素（从上到下）
1. **结果卡片**（白底，border: 2px solid #E9D8FD，圆角24px，box-shadow: 0 10px 30px rgba(139,92,246,0.15)）：
   - 大号Emoji图标（font-size: 48px）
   - 结果标题（font-size: 24px，桌面32px）
   - 分割线
   - 描述文字（text-align: justify）
2. **建议卡片**（背景 #FFF5F5，border: 1px solid #FED7D7）：
   - 标题：💡 自愈小建议（color: #C53030）
   - 内容文字（color: #4A5568）
3. **推广卡片**（渐变背景 `linear-gradient(135deg, #F0F4F8 0%, #E6EAF0 100%)`，border: 1px solid #CBD5E0）：
   - 标题："想要更深入了解自己？"
   - 动态��广文
   - 「限时活动」橙色badge + `全店打包 ¥6.9` 橙色价格
   - 主CTA按钮（深灰背景 #2D3748）：`去店铺解锁全部40+测试 / 含MBTI、高敏感、恋爱观等`
4. **推荐测试列表**：标题「更多专业测试」（两侧细线装饰），JS渲染卡片列表
5. **「重新测试」** 文字按钮（下划线，灰色）

### 桌面端结果页
- 单栏居中，max-width: 720px
- 各卡片宽100%
- 推荐列表改为 grid（auto-fill，min 280px卡片）

---

## 【推荐测试数据（16条）】

### 已开发（4条，显示在前）
| ID | 标题 | 副标题 | 标签 |
|----|------|--------|------|
| scl90 | SCL-90 心理健康测评 | 国际通用 · 全面心理体检 | 心理健康、专业 |
| love_possession | 恋爱占有欲测试 | 你的爱是由于不安还是深情？ | 恋爱、情感 |
| mbti_16 | MBTI 16型人格测试 | 探索你的核心性格代码 | 人格、MBTI |
| city_match | 性格城市匹配测试 | 哪座城市是你的灵魂归属？ | 生活、趣味 |

### 开发中（12条，标注"开发中"）
mbti_love（MBTI恋爱理想型）、childhood（童年创伤）、spiritual（精神需求）、adhd（ADHD注意力）、appearance（高颜值）、attachment（成人依恋）、female_type（女性类型）、age_love（年上年下）、npd（NPD自恋型）、psy_age（心理年龄）、talent（天赋）、animal（动物性格）

### 推荐卡片样式
```css
.rec-card {
    background: white; border-radius: 12px;
    padding: 16px; margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    cursor: pointer; transition: transform 0.1s;
}
/* 包含：序号 + 标题 + (开发中) badge + 副标题 + 标签 */
```
点击任意推荐卡片 → 跳转到详情介绍页（#intro-page）。

---

## 【页面4：详情介绍页 #intro-page】

### 结构
- 顶部导航：`❮ 返回结果` 文字按钮（紫色）
- 介绍区：标题 + 副标题 + 正文（含HTML格式：测评简介段落、评估维度段落）+ 标签组
- 底部悬浮操作栏（`.bottom-bar`）

### 底部操作栏
- **移动端**：fixed底部，全宽，flex两端对齐
- **桌面端**：absolute定位于右下角，自动宽度，白底圆角卡片
- 左侧：`单测 ¥0.99 / 全店打包 ¥6.9`（"6.9"高亮橙色）
- 右侧按钮：
  - 已开发测试 → `前往测试`（深色按钮）
  - 未开发测试 → `关注小红书`（#FF2442 小红书红按钮）+ 价格区域显示红色警告图标 + "测试未开发"

### 桌面端介绍页布局
```
左栏（1fr）：标题 + 副标题 + 标签
右栏（1.2fr）：描述文本（浅灰卡片，padding: 40px）
右下角：价格+按钮操作栏
```

---

## 【JavaScript核心逻辑】

```javascript
// 全局状态
let currentQuestionIndex = 0;
let totalScore = 0;

// 流程
入口页[开始自评按钮] → 答题页（重置状态，渲染第1题）
答题页[选中选项] → 积累分数 → 300ms后渲染下一题 / 显示结果
结果页[推荐卡片] → 详情介绍页（传入测试数据对象）
详情页[返回结果] → 返回结果页
结果页[重新测试] → 返回入口页（不重置，仅切换显示）

// 页面切换函数
function switchPage(fromPage, toPage) {
    fromPage: remove 'active-page', add 'hidden-page'
    100ms后 toPage: remove 'hidden-page', add 'active-page', scrollTop = 0
}
```

---

## 【店铺链接】

所有CTA按钮统一指向同一小红书店铺链接（变量 `SHOP_URL` 统一管理）。

---

## 【关键细节清单】

- [ ] `<meta viewport>` 禁止用户缩放（maximum-scale=1.0, user-scalable=no）
- [ ] body `overflow: hidden`（滚动在section内部发生）
- [ ] 所有按钮 `-webkit-tap-highlight-color: transparent`
- [ ] 选项点击后立即添加 `.selected` 类（视觉反馈），300ms后跳题
- [ ] 进度条宽度：`(当前题序号/10) * 100%`，CSS transition: 0.3s
- [ ] 题目文字切换时有淡入动效（opacity 0→1，200ms）
- [ ] 推广卡片「限时活动」badge：橙色(#ED8936)，小号字，圆角4px
- [ ] 推荐区标题「更多专业测试」：两侧用伪元素 `::before/::after` 画细线
- [ ] 介绍页开发中警告：圆形红底感叹号icon + 小字"测试未开发"（inline）
- [ ] 底部操作栏桌面适配：从 `position: fixed` 改为 `position: absolute`，right: 40px, bottom: 40px
- [ ] 结果描述文字：`\n` 替换为 `<br>` 输出（多行格式）
- [ ] 已有 `design_specification.md`（旧版）可参考配色细节

---

## 【AI生成设计稿关键词】

中文：心理测试单页应用、疗愈紫色主题、卡片化布局、移动端优先、温暖专业风
English: psychology quiz web app, healing purple theme, card-based layout, mobile-first, warm professional, rounded corners, soft shadows, pastel violet palette
