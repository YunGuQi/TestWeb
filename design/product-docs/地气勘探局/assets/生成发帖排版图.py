import asyncio
import os
import shutil
from playwright.async_api import async_playwright

QUESTIONS = [
    {
        "q": "1. 假设有一周无限制假期，你更想去哪里？",
        "options": ["A. 去一线城市的CBD看展、打卡网红店，感受繁华节奏", "B. 找个有山有水的江南小镇或者海边，每天自然醒", "C. 回老家，陪陪家人，吃点从小吃到大的苍蝇馆子"]
    },
    {
        "q": "2. 遇到工作上的高压和强连轴转，你的第一反应是？",
        "options": ["A. 这就是大城市的常态，熬过去就能升职加薪", "B. 身体吃不消了，甚至开始偷偷搜寻小城市的招聘", "C. 表面在卷，其实内心早就躺平，混到下班算数"]
    },
    {
        "q": "3. 看到朋友圈里有人回老家考公上岸了，你会？",
        "options": ["A. 毫无波澜，每个人追求不同，我还是想要更高的天花板", "B. 有点羡慕他们的稳定和安逸，甚至开始动摇", "C. 觉得他们一眼望到头的人生很无趣"]
    },
    {
        "q": "4. 周末的社交局，你通常的态度是？",
        "options": ["A. 必须出门拓展人脉，认识更多同频的大牛", "B. 只想跟两三个知根知底的老朋友呆着，绝不认识新人", "C. 拒绝一切社交，一个人在家充当“室内盆栽”"]
    },
    {
        "q": "5. 对于“买房定居”这件事，你的真实想法是？",
        "options": ["A. 拼尽全力也要在当前的大城市扎根，这代表着阶层跃升", "B. 赚点钱就回老家或者二线城市买个大点的房子，生活质量更重要", "C. 租房也挺好，随时可以换城市，不想被房贷绑架"]
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
            background-color: #f0ebe1; /* 牛皮纸质感 */
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
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
            font-size: 110px; font-weight: 900; line-height: 1.2; letter-spacing: -2px; text-align: left;
            width: 100%; color: #ab2828; margin-bottom: 60px;
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
            font-size: 40px; font-weight: 500; margin-bottom: 40px; padding: 40px; border: 4px solid #1a1a1a; border-radius: 20px;
            background: rgba(255,255,255,0.3); box-shadow: 10px 10px 0px #1a1a1a;
        }
        
        .footer-cta {
            position: absolute; bottom: 80px; right: 80px; font-size: 32px; font-weight: 900; color: #ab2828;
            border-bottom: 4px solid #ab2828; padding-bottom: 10px;
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
        <div class="header-tag">五行地气勘探 - 迁徙调令</div>
        <div class="q-container">
            <div class="title">大城市拼不动，<br>小城市躺不平？</div>
            <div class="subtitle">五行地气与性格色彩城市匹配系统<br><br><span style="font-size: 36px; color: #666;">（精准定位你的磁场归属地）</span></div>
        </div>
        <div class="footer-cta">左滑开启勘探 ➔</div>
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
            cta_text = "评论区 @问一问 查看系统调令 ➔"
            
        html_qi = HTML_TEMPLATE.replace('<body id="body-content">', f"""
        <body id="body-content">
            <div class="header-tag">SCENARIO {i+1}/05</div>
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
    save_dir = os.path.join(base_dir, "微光_2026-06-29")
    os.makedirs(save_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1080, "height": 1440}, device_scale_factor=1)
        
        await generate_images(page, save_dir)
        await browser.close()
        
    src_hook = os.path.join(base_dir, "测试截图", "引导版_钩子截图.png")
    dst_hook = os.path.join(save_dir, "P7_引导图.png")
    if os.path.exists(src_hook):
        shutil.copy2(src_hook, dst_hook)
        print("复制: P7_引导图.png")
    else:
        print("未找到 P7 引导图！请确保截图任务已完成。")

if __name__ == "__main__":
    asyncio.run(main())
