import asyncio
import os
from playwright.async_api import async_playwright

async def generate_standard_screenshots(page, save_dir):
    print("开始生成常规维度结果图...")
    types = [
        {"name": "工业_北京", "city": "北京", "tag": "冰冷的齿轮驱动者", "theme": "industrial", "desc": "在绝对理性的巨型机器里，你找到了最安全的齿轮位置。不需要废话，只看效率。", "dims": ["快节奏", "高边界", "秩序掌控", "冷峻现实"]},
        {"name": "旷野_阿勒泰", "city": "阿勒泰", "tag": "旷野里的吟游诗人", "theme": "nature", "desc": "去爱，去生活，去受伤。你的心太大，只有雪山和无垠的草场才能装得下。", "dims": ["慢摇摆", "高边界", "混沌随性", "温情理想"]},
        {"name": "赛博_重庆", "city": "重庆", "tag": "赛博江湖的夜游神", "theme": "cyber", "desc": "你适合在8D魔幻的街头吃着火锅，让喧嚣掩盖心事，在混沌中野蛮生长。", "dims": ["快节奏", "低边界", "混沌随性", "温情理想"]},
        {"name": "侘寂_大理", "city": "大理", "tag": "苍山洱海的流浪汉", "theme": "wabisabi", "desc": "把手表扔掉吧，你的灵魂在这里不需要打卡。随波逐流是你治愈自己的方式。", "dims": ["慢摇摆", "高边界", "混沌随性", "温情理想"]},
        {"name": "海洋_青岛", "city": "青岛", "tag": "海滨的踏浪人", "theme": "ocean", "desc": "讲究规矩，豪爽且务实。海风吹走了焦虑，留下了踏踏实实的现实主义。", "dims": ["慢摇摆", "低边界", "秩序掌控", "冷峻现实"]}
    ]
    
    for t in types:
        print(f"正在生成 {t['name']}...")
        await page.evaluate(f'''() => {{
            document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
            document.getElementById('result-page').classList.add('active');
            
            document.getElementById('r-city').textContent = "{t['city']}";
            document.getElementById('r-province').textContent = "{t['city']}";
            document.getElementById('r-tag').textContent = "{t['tag']}";
            document.getElementById('r-desc').textContent = "“{t['desc']}”";
            
            const dimsArray = {t['dims']};
            const dimsHtml = dimsArray.map(l => `<span class="dim-tag px-2 py-1 text-xs font-bold font-ticket border">${{l}}</span>`).join('');
            document.getElementById('r-dimensions').innerHTML = dimsHtml;
            
            // 切换主题
            document.body.className = document.body.className.replace(/\\btheme-[a-z]+\\b/g, '').trim();
            if ("{t['theme']}" !== 'industrial') {{
                document.body.classList.add("theme-{t['theme']}");
            }}
            
            // 去除阴影以供截图
            const ticket = document.getElementById('ticket-capture');
            if(ticket) {{
                ticket.style.boxShadow = 'none';
            }}
        }}''')
        
        await page.wait_for_timeout(1000)
        
        screenshot_path = os.path.join(save_dir, f"{t['name']}.jpg")
        card_elem = await page.query_selector("#ticket-capture")
        if card_elem:
            await card_elem.screenshot(path=screenshot_path)
            print(f"已保存: {screenshot_path}")

async def generate_hook_screenshot(page, save_dir):
    print("开始生成引导版(钩子)结果图...")
    out_path = os.path.join(save_dir, "引导版_钩子截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        document.getElementById('result-page').classList.add('active');
        
        document.getElementById('r-city').textContent = "未知坐标";
        document.getElementById('r-province').textContent = "保密";
        document.getElementById('r-tag').textContent = "流浪的灵魂";
        
        const dimsHtml = ['属性锁定', '边界锁定', '秩序锁定', '态度锁定'].map(l => `<span class="dim-tag px-2 py-1 text-xs font-bold font-ticket border">${l}</span>`).join('');
        document.getElementById('r-dimensions').innerHTML = dimsHtml;
        
        const hookText = '在评论区留下你的选项组合（如：AABB）<br>并 <span style="font-weight: 800;">@问一问</span> 即可得到答案，<br>获取完整版深度解析，获取专属的“车票”！';
        document.getElementById('r-desc').innerHTML = hookText;
        document.getElementById('r-desc').style.color = 'var(--theme-stamp)';
        document.getElementById('r-desc').style.fontWeight = 'bold';
        
        const ticket = document.getElementById('ticket-capture');
        if(ticket) {
            ticket.style.boxShadow = 'none';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('#ticket-capture')
    await card.screenshot(path=out_path)
    print(f"原生高清引流截图已成功生成：{out_path}")

async def generate_disclaimer_screenshot(page, save_dir):
    print("开始生成免责声明截图...")
    out_path = os.path.join(save_dir, "免责声明截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        document.getElementById('result-page').classList.add('active');
        
        document.getElementById('r-city').textContent = "免责声明";
        document.getElementById('r-province').textContent = "⚠️";
        document.getElementById('r-tag').textContent = "娱乐测试";
        
        const dimsHtml = ['非专业诊断', '仅供娱乐', '请勿当真', '理性看待'].map(l => `<span class="dim-tag px-2 py-1 text-xs font-bold font-ticket border">${l}</span>`).join('');
        document.getElementById('r-dimensions').innerHTML = dimsHtml;
        
        const disclaimerText = '本测试内容及其解析结果仅供休闲娱乐与自我探索参考，不具备任何专业心理学、医学或职场指导的科学严谨性。<br><br>测试结果并非专业诊断，请勿将其作为重大人生决定（如转行、离职、就医等）的依据。';
        document.getElementById('r-desc').innerHTML = disclaimerText;
        document.getElementById('r-desc').style.color = 'var(--theme-stamp)';
        document.getElementById('r-desc').style.fontWeight = 'bold';
        
        const ticket = document.getElementById('ticket-capture');
        if(ticket) {
            ticket.style.boxShadow = 'none';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('#ticket-capture')
    await card.screenshot(path=out_path)
    print(f"免责声明截图已成功生成：{out_path}")

async def generate_home_screenshot(page, save_dir):
    print("开始生成首页截图...")
    out_path = os.path.join(save_dir, "首页截图.png")
    await page.wait_for_timeout(1000)
    await page.screenshot(path=out_path, full_page=True)
    print(f"首页截图已成功生成：{out_path}")

async def main():
    test_name = "性格城市匹配"
    test_html_url = "file:///E:/AI/Antigravity/小红书/common/city-matching-test/index.html"
    
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
