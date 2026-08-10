import asyncio
import os
from playwright.async_api import async_playwright

async def generate_standard_screenshots(page, save_dir):
    print("开始生成常规维度结果图...")
    # 定义四种颜色（派系）对应的人格
    types = [
        {"name": "SP_黄人", "mbti": "ESTP"},
        {"name": "NT_紫人", "mbti": "INTJ"},
        {"name": "NF_绿人", "mbti": "ENFP"},
        {"name": "SJ_蓝人", "mbti": "ISFJ"}
    ]
    
    for t in types:
        print(f"正在生成 {t['name']} ({t['mbti']})...")
        
        # 使用evaluate直接渲染对应的结果
        await page.evaluate(f'''() => {{
            // 确保展示结果视图
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('result').classList.add('active');
            
            let mockScores = {{
                E: 20, I: 20, S: 20, N: 20,
                T: 20, F: 20, J: 20, P: 20,
                A: 30, O: 70, H: 40, C: 60
            }};
            // 给主导维度加分，确保 UI 正确偏向
            let m = "{t['mbti']}";
            for(let i=0; i<m.length; i++) {{
                mockScores[m[i]] = 80;
            }}
            // 调用原生页面的渲染函数
            if(typeof renderResult === "function") {{
                renderResult("{t['mbti']}", false, null, mockScores);
            }}
            
            // 截图时去掉阴影，保持干净
            const resultCard = document.querySelector('.result-card');
            if(resultCard) {{
                resultCard.style.borderRadius = '16px';
                resultCard.style.boxShadow = 'none';
            }}
        }}''')
        
        await page.wait_for_timeout(1000) # 等待渲染和进度条动画
        
        screenshot_path = os.path.join(save_dir, f"{t['name']}.jpg")
        card_elem = await page.query_selector(".result-card")
        if card_elem:
            await card_elem.screenshot(path=screenshot_path)
            print(f"已保存: {screenshot_path}")
        else:
            print(f"未能找到结果卡片: {t['name']}")

async def generate_hook_screenshot(page, save_dir):
    print("开始生成引导版(钩子)结果图...")
    out_path = os.path.join(save_dir, "引导版_钩子截图.png")
    
    # 通过执行 JavaScript 直接把界面调到我们需要的状态
    await page.evaluate("""
        // 切换到结果界面
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('result').classList.add('active');
        
        // 填充 "高能海王" 的所有数据，完全还原原生视觉
        document.getElementById('r-dest-code').innerText = 'KD-1';
        document.getElementById('r-dest-name').innerText = '极限作死飞行轨';
        document.getElementById('r-name').innerText = '高能海王';
        
        const badge = document.getElementById('r-faction-badge');
        badge.innerText = '黄人专属厅 SP';
        badge.style.color = '#d97706'; // 深黄色/橙色
        
        document.getElementById('r-class').innerText = '极限飙船舱';
        document.getElementById('r-id').innerText = 'ESTP-O-C';
        
        // 填充 Tags
        document.getElementById('r-tags').innerHTML = 
            '<div class="r-tag">#极限运动家</div><div class="r-tag">#活在当下</div>' +
            '<div class="r-tag">#风险爱好者</div><div class="r-tag">#刺激瘾者</div>';
        
        // 随便填一些条形图参数，不影响大局
        document.getElementById('rc-dims').style.display = 'block';
        document.getElementById('val-E').innerText = '80%';
        document.getElementById('bar-EI').style.width = '80%';
        document.getElementById('val-I').innerText = '20%';
        
        document.getElementById('val-S').innerText = '80%';
        document.getElementById('bar-SN').style.width = '80%';
        document.getElementById('val-N').innerText = '20%';
        
        document.getElementById('val-T').innerText = '80%';
        document.getElementById('bar-TF').style.width = '80%';
        document.getElementById('val-F').innerText = '20%';
        
        document.getElementById('val-J').innerText = '20%';
        document.getElementById('bar-JP').style.width = '20%';
        document.getElementById('bar-JP').style.marginLeft = '80%'; // 从右边长
        document.getElementById('val-P').innerText = '80%';
        
        document.getElementById('val-A').innerText = '30%';
        document.getElementById('bar-AO').style.width = '30%';
        document.getElementById('val-O').innerText = '70%';
        
        document.getElementById('val-H').innerText = '40%';
        document.getElementById('bar-HC').style.width = '40%';
        document.getElementById('val-C').innerText = '60%';
        
        // 【核心】修改底部评估话术为引流钩子！
        const quote = document.getElementById('r-quote');
        quote.innerHTML = '在评论区留下你的选项组合（如：ADBB）<br>并 <span style="color: #2563eb; font-weight: 800;">@问一问</span> 即可得到答案，<br>获取完整版深度解析，获取专属的“机票”！';
        quote.style.borderLeftColor = '#d97706'; // 匹配黄人橙色边框
        
        // 隐藏下方不需要的按钮，去掉阴影
        const resultCard = document.querySelector('.result-card');
        resultCard.style.borderRadius = '16px'; 
        resultCard.style.boxShadow = 'none'; // 截图时不需要多余外阴影
    """)
    
    await page.wait_for_timeout(1000)
    
    # 定位并截图仅仅 .result-card 这个原生 DOM
    card = page.locator('.result-card')
    await card.screenshot(path=out_path)
    print(f"原生高清引流截图已成功生成：{out_path}")

async def generate_disclaimer_screenshot(page, save_dir):
    print("开始生成免责声明截图...")
    out_path = os.path.join(save_dir, "免责声明截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('result').classList.add('active');
        
        document.getElementById('r-dest-code').innerText = '⚠️';
        document.getElementById('r-dest-name').innerText = '免责声明';
        document.getElementById('r-name').innerText = '娱乐测试';
        
        const badge = document.getElementById('r-faction-badge');
        badge.innerText = '仅供参考';
        badge.style.color = '#d97706';
        
        document.getElementById('r-class').innerText = '非专业诊断';
        document.getElementById('r-id').innerText = 'NO-MEDICAL';
        
        document.getElementById('r-tags').innerHTML = 
            '<div class="r-tag">#仅供休闲娱乐</div><div class="r-tag">#自我探索参考</div>' +
            '<div class="r-tag">#非专业诊断</div><div class="r-tag">#请勿当真</div>';
        
        document.getElementById('rc-dims').style.display = 'none';
        
        const quote = document.getElementById('r-quote');
        quote.innerHTML = '本测试内容及其解析结果仅供休闲娱乐与自我探索参考，不具备任何专业心理学、医学或职场指导的科学严谨性。<br><br>测试结果并非专业诊断，请勿将其作为重大人生决定（如转行、离职、就医等）的依据。<br><br>如遇真实的心理困扰，请向具有执业资格的专业机构寻求帮助。';
        quote.style.borderLeftColor = '#d97706';
        
        const resultCard = document.querySelector('.result-card');
        resultCard.style.borderRadius = '16px'; 
        resultCard.style.boxShadow = 'none';
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('.result-card')
    await card.screenshot(path=out_path)
    print(f"免责声明截图已成功生成：{out_path}")

async def generate_home_screenshot(page, save_dir):
    print("开始生成首页截图...")
    out_path = os.path.join(save_dir, "首页截图.png")
    await page.wait_for_timeout(1000)
    await page.screenshot(path=out_path, full_page=True)
    print(f"首页截图已成功生成：{out_path}")

async def main():
    # 测试相关配置
    test_name = "平行宇宙航线"
    test_html_url = "file:///E:/AI/Antigravity/小红书/common/mbti-crystal-test/index.html"
    
    # 构建绝对路径
    base_dir = os.path.dirname(os.path.abspath(__file__))
    save_dir = os.path.join(base_dir, "测试截图")
    os.makedirs(save_dir, exist_ok=True)
    
    print(f"开始为【{test_name}】生成自动化测试截图资产...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # 设置较大的视口和设备缩放(device_scale_factor=3)以获得高清截图
        page = await browser.new_page(viewport={"width": 480, "height": 1000}, device_scale_factor=3)
        await page.goto(test_html_url)
        await generate_home_screenshot(page, save_dir)
        
        # 1. 生成常规多维度截图
        await generate_standard_screenshots(page, save_dir)
        
        # 2. 生成带引流钩子的引导版截图
        await generate_hook_screenshot(page, save_dir)
        await generate_disclaimer_screenshot(page, save_dir)
        
        await browser.close()
        
    print(f"所有截图生成完毕，已保存至：{save_dir}")

if __name__ == "__main__":
    asyncio.run(main())
