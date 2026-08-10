import asyncio
import os
from playwright.async_api import async_playwright

async def generate_standard_screenshots(page, save_dir):
    print("开始生成常规维度结果图...")
    types = [
        {"name": "低内耗_一毛不拔", "title": "【一毛不拔】", "total": "150", "desc": "评估结论：你的情绪防火墙堪比银行金库。你几乎不为外界的评价买单，绝不为不值得的人花一分钱情绪。保持这种冷酷，干得漂亮！"},
        {"name": "中内耗_收支平衡", "title": "【收支平衡】", "total": "1250", "desc": "评估结论：你有一定的情绪损耗，但大多在安全线内。偶尔的胡思乱想就当是交了大脑的停车费，建议今晚早点睡，省点余额。"},
        {"name": "高内耗_严重透支", "title": "【严重透支】", "total": "4500", "desc": "评估结论：警告！您的心灵信用卡已被刷爆！你每天都在为他人的眼光和虚无的担忧支付巨额税款。你极度敏锐，但也极度疲惫。"}
    ]
    
    for t in types:
        print(f"正在生成 {t['name']}...")
        await page.evaluate(f'''() => {{
            document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
            document.getElementById('result-page').classList.add('active');
            
            document.getElementById('result-title').textContent = "{t['title']}";
            document.getElementById('result-desc').innerHTML = "{t['desc']}";
            document.getElementById('receipt-total').textContent = "{t['total']}";
            
            // Mock items
            const itemsContainer = document.getElementById('receipt-items');
            itemsContainer.innerHTML = `
                <div class="flex justify-between items-baseline gap-2"><span class="truncate flex-1">无意义失眠费</span><span>500</span></div>
                <div class="flex justify-between items-baseline gap-2"><span class="truncate flex-1">灾难化想象费</span><span>300</span></div>
                <div class="flex justify-between items-baseline gap-2"><span class="truncate flex-1">选择困难罚单</span><span>300</span></div>
            `;
            
            // 去除多余的阴影和滤镜便于截图
            const container = document.querySelector('.receipt-container');
            if(container) {{
                container.style.filter = 'none';
            }}
        }}''')
        
        await page.wait_for_timeout(1000)
        
        screenshot_path = os.path.join(save_dir, f"{t['name']}.jpg")
        card_elem = await page.query_selector(".receipt-container")
        if card_elem:
            await card_elem.screenshot(path=screenshot_path)
            print(f"已保存: {screenshot_path}")

async def generate_hook_screenshot(page, save_dir):
    print("开始生成引导版(钩子)结果图...")
    out_path = os.path.join(save_dir, "引导版_钩子截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        document.getElementById('result-page').classList.add('active');
        
        document.getElementById('result-title').textContent = "【系统结算中】";
        document.getElementById('receipt-total').textContent = "****";
        
        const hookText = '在评论区留下你的选项组合（如：AABB）<br>并 <span style="color: #2563eb; font-weight: 900;">@问一问</span> 即可得到答案，<br>获取完整版深度解析，获取专属的“账单”！';
        document.getElementById('result-desc').innerHTML = hookText;
        
        const container = document.querySelector('.receipt-container');
        if(container) {
            container.style.filter = 'none';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('.receipt-container')
    await card.screenshot(path=out_path)
    print(f"原生高清引流截图已成功生成：{out_path}")

async def generate_disclaimer_screenshot(page, save_dir):
    print("开始生成免责声明截图...")
    out_path = os.path.join(save_dir, "免责声明截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        document.getElementById('result-page').classList.add('active');
        
        document.getElementById('result-title').textContent = "⚠️ 娱乐测试 免责声明";
        document.getElementById('receipt-total').textContent = "仅供参考";
        
        const disclaimerText = '本测试内容及其解析结果仅供休闲娱乐与自我探索参考，不具备任何专业心理学、医学或职场指导的科学严谨性。<br><br>测试结果并非专业诊断，请勿将其作为重大人生决定（如转行、离职、就医等）的依据。如遇真实的心理困扰，请向具有执业资格的专业机构寻求帮助。';
        document.getElementById('result-desc').innerHTML = disclaimerText;
        
        const container = document.querySelector('.receipt-container');
        if(container) {
            container.style.filter = 'none';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('.receipt-container')
    await card.screenshot(path=out_path)
    print(f"免责声明截图已成功生成：{out_path}")

async def generate_home_screenshot(page, save_dir):
    print("开始生成首页截图...")
    out_path = os.path.join(save_dir, "首页截图.png")
    await page.wait_for_timeout(1000)
    await page.screenshot(path=out_path, full_page=True)
    print(f"首页截图已成功生成：{out_path}")

async def main():
    test_name = "深度情绪内耗"
    test_html_url = "file:///E:/AI/Antigravity/小红书/common/emotional-friction-test/index.html"
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    save_dir = os.path.join(base_dir, "测试截图")
    os.makedirs(save_dir, exist_ok=True)
    
    print(f"开始为【{test_name}】生成自动化测试截图资产...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 480, "height": 1000}, device_scale_factor=3)
        await page.goto(test_html_url)
        await generate_home_screenshot(page, save_dir)
        
        await generate_standard_screenshots(page, save_dir)
        await generate_hook_screenshot(page, save_dir)
        await generate_disclaimer_screenshot(page, save_dir)
        
        await browser.close()
        
if __name__ == "__main__":
    asyncio.run(main())
