# 心理测试网站设计规范提示词

## 一、核心设计理念

创建一个**专业、温暖、现代**的心理测试网站，采用**疗愈紫色**主题，传达心理学的专业性和人文关怀。视觉风格参考主流心理测试平台(如MBTI、16Personalities)的卡片化设计。

---

## 二、色彩系统

### 主色调 - 疗愈紫系 (Healing Purple)
- **主题紫:** `#8B5CF6` (Violet-500) - 用于按钮、强调元素
- **深紫:** `#4C1D95` (Violet-900) - 主要文字颜色，替代传统黑色
- **中紫:** `#7C3AED` (Violet-600) - 次要文字、按钮hover态
- **浅紫装饰:** `#E9D8FD` (Violet-200) - 边框、标签底色
- **极淡紫:** `#F8F5FF` / `#FAF5FF` - 页面背景、卡片淡色底

### 辅助色
- **纯白:** `#FFFFFF` - 卡片主体背景
- **警示色:** `#FF2442` (小红书红) - 未开发功能标识

### 渐变应用
- **页面背景:** `radial-gradient(circle at 50% 10%, #E9D8FD 0%, #F8F5FF 60%)`
- **桌面背景:** `#F3E8FF` 纯色

---

## 三、布局架构

### 响应式断点
- **移动端:** `< 768px` - 垂直单栏,全屏流式布局
- **桌面端:** `≥ 768px` - 居中卡片容器,最大宽度 1000px

### 桌面端容器规范
```css
.app-container {
    max-width: 1000px;
    width: 90%;
    height: 85vh;
    max-height: 900px;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(109, 40, 217, 0.15);
    background: white;
}
```

### 核心页面布局

#### 1. 入口页 (Landing Page)
- **结构:** 垂直居中对齐
- **元素顺序:**
  1. 品牌名称 (小号,灰色)
  2. 主标题 (28px, 深紫)
  3. 副标题标签 (浅紫底,圆角胶囊)
  4. 信任指标卡片 (白底横向排列,3个图标+文字)
  5. 主操作按钮 (紫色,全宽,圆角50px)
  6. 免责声明 (小号灰字)

#### 2. 介绍页 (Intro Page)
- **桌面端:** 2栏网格布局 (1fr : 1.2fr)
  - **左栏:** 标题、副标题、标签
  - **右栏:** 描述文本(独立浅灰卡片)
  - **底部操作栏:** 浮动在右下角 (价格 + 按钮)
- **移动端:** 垂直堆叠

#### 3. 结果页 (Result Page)
- **布局:** 单栏居中堆叠 (max-width: 720px)
- **元素顺序:**
  1. **结果卡片** (特大号,居中):
     - 2px紫色边框 (`#E9D8FD`)
     - 顶部装饰条 (8px高紫色渐变)
     - 大图标 + 结果标题(32px) + 描述
  2. **建议卡片** (淡紫底 `#FAF5FF`)
  3. **推广卡片** (白底)
  4. **推荐测试网格** (auto-fill, 280px卡片)

---

## 四、组件设计规范

### 卡片 (Card)
```css
标准卡片样式:
- background: white;
- border-radius: 16px ~ 24px (越大越重要);
- border: 1px solid rgba(139, 92, 246, 0.1);
- box-shadow: 0 8px 24px rgba(139, 92, 246, 0.12);
- padding: 30px ~ 50px (根据重要性);
```

### 按钮 (Button)
**主按钮:**
```css
background: #8B5CF6;
color: white;
border-radius: 20px ~ 50px;
padding: 14px 24px;
box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
font-weight: 600;
```

**小红书品牌按钮 (特殊):**
```css
background: #FF2442;
带有小红书logo或文字提示
```

### 标签 (Tag)
```css
background: #E9D8FD;
color: #6B46C1;
border-radius: 20px (胶囊状);
padding: 6px 16px;
font-size: 12-14px;
```

### 输入/选项
```css
测试选项按钮:
- 白底,细边框
- hover/选中: 浅蓝底 (#EBF8FF), 紫边框
- 圆角12px
- padding: 18px
```

---

## 五、字体规范

### 字体族
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### 字号层级
- **超大标题:** 32px (结果页主标题)
- **大标题:** 24-28px (页面主标题)
- **副标题:** 18px
- **正文:** 15-16px (桌面), 14-15px (移动)
- **小字:** 12px (标签,提示)
- **微小字:** 10-11px (免责声明)

### 字重
- **粗体:** 600-700 (标题,按钮)
- **中等:** 500 (副标题)
- **常规:** 400 (正文)

---

## 六、间距系统

### 内边距 (Padding)
- **大卡片:** 40-50px
- **中卡片:** 24-30px
- **小卡片:** 16-20px

### 外边距 (Margin/Gap)
- **章节间距:** 40px
- **卡片间距:** 24-30px
- **元素间距:** 16px
- **小元素间距:** 8-12px

### 圆角 (Border Radius)
- **容器:** 24px
- **大卡片:** 20-24px
- **标准卡片:** 16px
- **按钮/标签:** 20px (大按钮50px全圆角)
- **小组件:** 8-12px

---

## 七、阴影系统

### 阴影层级
```css
/* 轻阴影 - 小卡片 */
box-shadow: 0 4px 12px rgba(139, 92, 246, 0.05);

/* 标准阴影 - 普通卡片 */
box-shadow: 0 8px 24px rgba(139, 92, 246, 0.12);

/* 强阴影 - 重要卡片/容器 */
box-shadow: 0 10px 30px rgba(139, 92, 246, 0.15);

/* 超强阴影 - 桌面主容器 */
box-shadow: 0 20px 60px rgba(109, 40, 217, 0.15);
```

---

## 八、交互动效

### 点击反馈
```css
button:active, .clickable:active {
    transform: scale(0.96 ~ 0.98);
    transition: transform 0.1s;
}
```

### 页面切换
```css
淡入淡出 + 轻微上移:
transition: opacity 0.4s ease, transform 0.4s ease;
transform: translateY(20px) -> translateY(0);
```

---

## 九、特殊功能组件

### 1. 进度条
```css
容器: 高6px, 浅灰底 (#EDF2F7)
进度: 紫色 (#8B5CF6), 动画过渡
```

### 2. 底部操作栏 (Intro页)
```css
移动端: fixed底部,全宽
桌面端: absolute定位右下角,自动宽度
display: flex, gap: 20px
background: white
shadow: 0 -4px 12px rgba(0,0,0,0.05)
```

### 3. 未开发警告标识
```css
图标: 圆形,红底白字感叹号
文字: 小号灰字 "测试未开发"
按钮: 小红书品牌红 "关注小红书"
```

---

## 十、实现要点总结

### CSS变量定义
```css
:root {
    --bg-color: #F8F5FF;
    --card-bg: #FFFFFF;
    --text-primary: #4C1D95;
    --text-secondary: #7C3AED;
    --accent-color: #8B5CF6;
    --accent-dark: #7C3AED;
    --accent-light: #E9D8FD;
    --border-radius: 16px;
    --box-shadow: 0 8px 24px rgba(139, 92, 246, 0.12);
    --card-border: 1px solid rgba(139, 92, 246, 0.1);
}
```

### 响应式关键点
1. **桌面:** body flex居中 + app-container卡片化
2. **移动:** body正常流 + container全屏
3. **结果页:** 桌面单栏居中(720px) + 移动全宽
4. **介绍页:** 桌面2栏grid + 移动垂直stack

---

## 十一、设计关键词提示

如果用AI生成设计稿,使用以下关键词:
- "心理测试网站"
- "疗愈紫色主题"
- "MBTI风格"
- "卡片化设计"
- "柔和渐变背景"
- "大圆角"
- "轻阴影"
- "专业温暖"
- "现代极简"
- "响应式布局"
- "单页应用"
