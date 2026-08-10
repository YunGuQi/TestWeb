import asyncio
import os
from playwright.async_api import async_playwright

async def generate_standard_screenshots(page, save_dir):
    print("开始生成常规维度结果图...")
    types = [
        {"name": "金_钢铁森林", "city": "深圳", "desc": "经测算，该员命盘【金气】汇聚或极度渴求。骨子里的锐利与对秩序的追求，在安逸中只会被消磨。特批调往极度慕强、效率至上的钢铁森林，唯有极致的搞钱节奏和厮杀，能治愈你的精神内耗。"},
        {"name": "木_自然旷野", "city": "阿勒泰", "desc": "经测算，该员【木气】枯竭。灵魂正在钢筋水泥的格子间里加速枯萎。特批即日流放至旷野，急需极高浓度的含氧量、没有天花板的自然疗愈，以及毫无目的地的精神散步，以恢复生命力。"},
        {"name": "水_沿海温情", "city": "泉州", "desc": "经测算，该员【水流】停滞，神经紧绷过度。水利万物而不争，特批调往南方沿海或极具市井烟火气之地。在老街的茶香、肠粉的热气和海风中，找回生命的流动感与松弛。"},
        {"name": "火_狂热之城", "city": "重庆", "desc": "经测算，该员【命格缺火】，生命体征趋于平庸，一眼望到头的生活是致命毒药。特调往火炉之城，你需要一顿爆辣的火锅、不夜城的绝对喧嚣和一次彻底的狂欢，来重新点燃心跳。"},
        {"name": "土_历史古都", "city": "西安", "desc": "经测算，该员【土气】流失，漂泊感过重，根系已然不稳。建议即刻调往底蕴深厚的安逸之都。你需要厚重的历史围墙和巴适到骨子里的生活节奏，来稳稳接住你所有的疲惫。"}
    ]
    
    for t in types:
        print(f"正在生成 {t['name']}...")
        await page.evaluate(f'''() => {{
            document.querySelectorAll('#app > div').forEach(el => el.classList.add('hidden'));
            document.getElementById('result-page').classList.remove('hidden');
            
            document.getElementById('result-city').innerText = "{t['city']}";
            document.getElementById('result-desc').innerHTML = "{t['desc']}";
            document.getElementById('doc-id').innerText = "XHS-0001";
            document.getElementById('current-date').innerText = new Date().toLocaleDateString('zh-CN').replace(/\//g, '.');
            
            // 注入雷达图数据并重新绘制
            scores = {{'金': 2, '木': 2, '水': 2, '火': 2, '土': 2}};
            scores["{t['name'].split('_')[0]}"] = 10;
            if (typeof drawRadarChart === 'function') {{
                drawRadarChart();
            }}
            
            // 确保没有多余按钮和样式干扰截图
            const posterArea = document.getElementById('poster-area');
            if(posterArea) {{
                posterArea.style.borderRadius = '16px';
            }}
        }}''')
        
        await page.wait_for_timeout(1000)
        
        screenshot_path = os.path.join(save_dir, f"{t['name']}.jpg")
        card_elem = await page.query_selector("#poster-area")
        if card_elem:
            await card_elem.screenshot(path=screenshot_path)
            print(f"已保存: {screenshot_path}")

async def generate_hook_screenshot(page, save_dir):
    print("开始生成引导版(钩子)结果图...")
    out_path = os.path.join(save_dir, "引导版_钩子截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('#app > div').forEach(el => el.classList.add('hidden'));
        document.getElementById('result-page').classList.remove('hidden');
        
        document.getElementById('result-city').innerText = "未知坐标";
        
        const hookText = '在评论区留下你的选项组合（如：AABB）<br>并 <span style="color: #ab2828; font-weight: 800;">@问一问</span> 即可得到答案，<br>获取完整版深度解析，获取专属的“调令”！';
        document.getElementById('result-desc').innerHTML = hookText;
        document.getElementById('doc-id').innerText = "XHS-HOOK";
        
        scores = {'金': 5, '木': 5, '水': 5, '火': 5, '土': 5};
        if (typeof drawRadarChart === 'function') {
            drawRadarChart();
        }
        
        const posterArea = document.getElementById('poster-area');
        if(posterArea) {
            posterArea.style.borderRadius = '16px';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('#poster-area')
    await card.screenshot(path=out_path)
    print(f"原生高清引流截图已成功生成：{out_path}")

async def generate_disclaimer_screenshot(page, save_dir):
    print("开始生成免责声明截图...")
    out_path = os.path.join(save_dir, "免责声明截图.png")
    
    await page.evaluate("""
        document.querySelectorAll('#app > div').forEach(el => el.classList.add('hidden'));
        document.getElementById('result-page').classList.remove('hidden');
        
        document.getElementById('result-city').innerText = "免责声明";
        
        const disclaimerText = '本测试内容及其解析结果仅供休闲娱乐与自我探索参考，不具备任何专业心理学、医学或职场指导的科学严谨性。<br><br>测试结果并非专业诊断，请勿将其作为重大人生决定的依据。';
        document.getElementById('result-desc').innerHTML = disclaimerText;
        document.getElementById('doc-id').innerText = "XHS-⚠️";
        
        scores = {'金': 5, '木': 5, '水': 5, '火': 5, '土': 5};
        if (typeof drawRadarChart === 'function') {
            drawRadarChart();
        }
        
        const posterArea = document.getElementById('poster-area');
        if(posterArea) {
            posterArea.style.borderRadius = '16px';
        }
    """)
    
    await page.wait_for_timeout(1000)
    
    card = page.locator('#poster-area')
    await card.screenshot(path=out_path)
    print(f"免责声明截图已成功生成：{out_path}")

async def generate_home_screenshot(page, save_dir):
    print("开始生成首页截图...")
    out_path = os.path.join(save_dir, "首页截图.png")
    await page.wait_for_timeout(1000)
    await page.screenshot(path=out_path, full_page=True)
    print(f"首页截图已成功生成：{out_path}")

async def main():
    test_name = "地气勘探局"
    test_html_url = "file:///E:/AI/Antigravity/小红书/common/five-elements-city-test/index.html"
    
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
