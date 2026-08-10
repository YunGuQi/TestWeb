import asyncio
import os
import shutil
from playwright.async_api import async_playwright

QUESTIONS = [
    {
        "q": "1. 周末难得的空闲时光，你更倾向于怎么度过？",
        "options": ["A. 自己窝着充电，或者只和极少量的熟人呆着", "B. 和朋友出去玩，或者希望能有人陪着我", "C. 看心情，一个人很爽，有朋友约也开心"]
    },
    {
        "q": "2. 如果对方突然几个小时没有回消息，你内心的第一反应是？",
        "options": ["A. 完了，是不是我做错什么了？还是TA不爱我了？", "B. 估计在忙吧，我先做自己的事情。", "C. 表面装作不在乎，其实心里很烦躁。", "D. 不回就不回，搞得谁好像很闲一样。"]
    },
    {
        "q": "3. 在一段关系里，你最害怕发生什么？",
        "options": ["A. 彻底失去自我，私人边界被完全侵入。", "B. 被抛弃，发现自己其实没有那么重要。", "C. 沟通不畅，明明有事却非要憋在心里。", "D. 渴望靠近，但又害怕靠近后对方会离开我。"]
    },
    {
        "q": "4. 当你们之间产生激烈的争吵时，你通常会怎么应对？",
        "options": ["A. 不想吵了，觉得很累，直接冷战或者躲起来。", "B. 必须立刻把问题说清楚，TA不说话我就更生气。", "C. 先冷静一下，等双方情绪平稳了再理性沟通。", "D. 先说一些狠话刺伤对方，然后自己又后悔得要命。"]
    },
    {
        "q": "5. 对于承诺（比如同居、结婚、买房等），你的态度是？",
        "options": ["A. 极度渴望，这能带给我巨大的安全感。", "B. 顺其自然，只要感情到位了就水到渠成。", "C. 本能地想逃，觉得承诺意味着被束缚。", "D. 既想要又害怕，觉得承诺也许只是镜花水月。"]
    }
]

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&display=swap');
        body {
            margin: 0; padding: 0;
            width: 1080px; height: 1440px;
            background-color: #efe9db; /* 牛皮纸质感 */
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E");
            color: #1a1a1a;
            font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            padding: 100px;
        }
        .header-tag {
            position: absolute; top: 80px; left: 80px; font-size: 36px; font-weight: 900; letter-spacing: 2px;
            display: flex; align-items: center; gap: 16px;
        }
        .header-tag::before { content: ''; width: 40px; height: 8px; background: #1a1a1a; }
        
        .title {
            font-family: 'Noto Serif SC', serif;
            font-size: 130px; font-weight: 900; line-height: 1.2; letter-spacing: -2px; text-align: left;
            width: 100%; color: #d93838; margin-bottom: 60px;
        }
        .subtitle {
            font-size: 48px; font-weight: 600; color: #1a1a1a; width: 100%; text-align: left;
            border-left: 10px solid #1a1a1a; padding-left: 30px; line-height: 1.5;
        }
        
        /* Question Layout */
        .q-container {
            width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center;
        }
        .q-title {
            font-size: 64px; font-weight: 900; line-height: 1.4; margin-bottom: 80px; color: #1a1a1a;
        }
        .q-opt {
            font-size: 42px; font-weight: 500; margin-bottom: 40px; padding: 40px; border: 4px solid #1a1a1a; border-radius: 20px;
            background: rgba(255,255,255,0.4); box-shadow: 10px 10px 0px #1a1a1a;
        }
        
        .footer-cta {
            position: absolute; bottom: 80px; right: 80px; font-size: 32px; font-weight: 900; color: #d93838;
            border-bottom: 4px solid #d93838; padding-bottom: 10px;
        }
    </style>
</head>
<body id="body-content">
</body>
</html>
"""

async def generate_images(page, save_dir):
    # P1: 首图
    html_p1 = HTML_TEMPLATE.replace('<body id="body-content">', f"""
    <body id="body-content">
        <div class="header-tag">NO.012 - 恋爱心理测算</div>
        <div class="q-container">
            <div class="title">你是患得患失，<br>还是习惯性逃避？</div>
            <div class="subtitle">深度依恋防御机制解析<br><br><span style="font-size: 36px; color: #666;">（共15题，选取核心场景测算）</span></div>
        </div>
        <div class="footer-cta">左滑开始测试 ➔</div>
    """)
    await page.set_content(html_p1)
    await page.wait_for_timeout(500)
    await page.screenshot(path=os.path.join(save_dir, "P1_首图.jpg"), quality=90, type='jpeg')
    print("生成: P1_首图.jpg")
    
    # P2 ~ P6: 题目1-5
    for i, q in enumerate(QUESTIONS):
        opts_html = "".join([f'<div class="q-opt">{opt}</div>' for opt in q['options']])
        
        cta_text = "左滑继续 ➔"
        if i == 4:
            cta_text = "评论区 @问一问 查看结果 ➔"
            
        html_qi = HTML_TEMPLATE.replace('<body id="body-content">', f"""
        <body id="body-content">
            <div class="header-tag">SCENARIO {i+1}/15</div>
            <div class="q-container" style="justify-content: flex-start; padding-top: 200px;">
                <div class="q-title">{q['q']}</div>
                {opts_html}
            </div>
            <div class="footer-cta">{cta_text}</div>
        """)
        await page.set_content(html_qi)
        await page.wait_for_timeout(500)
        await page.screenshot(path=os.path.join(save_dir, f"P{i+2}_Q{i+1}.jpg"), quality=90, type='jpeg')
        print(f"生成: P{i+2}_Q{i+1}.jpg")
        
async def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # 目标目录: 帖子物料/恋爱物种领养中心/微光_2026-06-29
    save_dir = os.path.join(base_dir, "微光_2026-06-29")
    os.makedirs(save_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # 1080x1440 小红书标准 3:4 分辨率
        page = await browser.new_page(viewport={"width": 1080, "height": 1440}, device_scale_factor=1)
        
        await generate_images(page, save_dir)
        await browser.close()
        
    # P7: 从 测试截图 中拷贝 引导版_钩子截图.png
    src_hook = os.path.join(base_dir, "测试截图", "引导版_钩子截图.png")
    dst_hook = os.path.join(save_dir, "P7_引导图.png")
    if os.path.exists(src_hook):
        shutil.copy2(src_hook, dst_hook)
        print("复制: P7_引导图.png")
    else:
        print("未找到 P7 引导图！")

if __name__ == "__main__":
    asyncio.run(main())
